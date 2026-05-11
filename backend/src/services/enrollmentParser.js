const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');

// ============================================================================
// NORMALIZAÇÃO DE NOMES (remove acentos, upper, sem espaços)
// Usado para matching entre nome do PDF e nome no banco
// ============================================================================
function normalizeName(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

// ============================================================================
// EXTRAÇÃO DE TEXTO DO PDF
// ============================================================================
async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

// ============================================================================
// EXTRAÇÃO DO SEMESTRE
// Ex: "ATESTADO DE MATRÍCULA 2026/1" → "2026/1"
// ============================================================================
function extractSemester(text) {
  const match = text.match(/ATESTADO\s+DE\s+MATR[IÍ]CULA\s+(\d{4}\/\d)/i);
  return match ? match[1] : null;
}

// ============================================================================
// EXTRAÇÃO DO NOME DO ALUNO
// Ex: "Atestamos que DAVI EMILIO DE PAULA FONSECA matrícula"
// ============================================================================
function extractStudentName(text) {
  const match = text.match(/Atestamos\s+que\s+([A-ZÁÉÍÓÚÃÕÂÊÎÔÛÀÜÇ][A-ZÁÉÍÓÚÃÕÂÊÎÔÛÀÜÇ\s]+?)\s+matr[íi]cula/i);
  return match ? match[1].trim() : null;
}

// ============================================================================
// EXTRAÇÃO DA LISTA DE MATÉRIAS (tabela limpa no rodapé do atestado UFOP)
// Formato: "CSI106  11  FUNDAMENTOS TEORICOS DA COMPUTACAO  JOAO MONLEVADE  PORTUGUES"
// ============================================================================
function extractSubjectList(text) {
  // Tenta delimitar a seção entre cabeçalho e rodapé
  // O pdf-parse extrai colunas sem espaços: "CódigoTurmaDisciplinaPrédioIdioma"
  const headerIdx = text.search(/C[oó]digo\s*Turma\s*Disciplina/i);
  const footerIdx = text.search(/P\s*=\s*Aula\s*Pr[aá]tica/i);

  const section = (headerIdx !== -1 && footerIdx !== -1)
    ? text.substring(headerIdx, footerIdx)
    : text;

  const subjects = [];
  const seen = new Set();

  // Colunas chegam coladas: "CSI10611FUNDAMENTOS TEORICOS DA COMPUTACAOJOAO MONLEVADEPORTUGUES"
  // Regex: código | turma (1-2 dígitos) | nome (lazy) | campus conhecido | idioma
  const lines = section.split('\n');
  for (const line of lines) {
    const match = line.trim().match(
      /^([A-Z]{2,5}\d{3})(\d{1,2})(.+?)(?:JOAO\s*MONLEVADE|OURO\s*PRETO|MARIANA|JOAO\s*PESSOA)(?:PORTUGUES|INGLES)\s*$/
    );
    if (match) {
      const code = match[1].trim();
      if (!seen.has(code)) {
        seen.add(code);
        subjects.push({
          code,
          turma: match[2].trim(),
          name: match[3].trim()
        });
      }
    }
  }

  return subjects;
}

// ============================================================================
// EXTRAÇÃO DE HORÁRIOS DETERMINÍSTICA via coordenadas X,Y do PDF
//
// O SIGAA/UFOP gera PDFs com texto posicionado. pdf-parse expõe as
// coordenadas (transform[4]=x, transform[5]=y) de cada item de texto.
//
// Estratégia:
//   1. Extrair células de grade (códigos tipo CSI990-11T) com (x,y)
//   2. Extrair rótulos de horário (07:30 - 08:20) com y → mapear y→hora
//   3. Agrupar células por X (±tolerance) → colunas = dias da semana
//   4. Ordenar cada coluna por Y decrescente → ordem de tempo (y alto = cedo)
//   5. Agrupar células consecutivas de mesmo código → uma sessão
//   6. Start time = y da primeira célula do grupo → hora via mapeamento
// ============================================================================
async function extractScheduleFromCoordinates(buffer) {
  const items = [];

  try {
    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        const content = await pageData.getTextContent();
        for (const item of (content.items || [])) {
          const text = (item.str || '').trim();
          if (text && item.transform) {
            items.push({
              text,
              x: item.transform[4],
              y: item.transform[5]
            });
          }
        }
        return content.items.map(i => i.str).join('');
      }
    });
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  // 1. Mapeia y → hora inicial (a partir dos rótulos "07:30 - 08:20")
  const timeRe = /^(\d{2}:\d{2})\s*-\s*\d{2}:\d{2}$/;
  const yToTime = {};
  for (const item of items) {
    const m = item.text.match(timeRe);
    if (m) {
      const y = Math.round(item.y);
      if (!yToTime[y]) yToTime[y] = m[1];
    }
  }

  function nearestTime(y) {
    const ry = Math.round(y);
    if (yToTime[ry]) return yToTime[ry];
    let best = null, bestDiff = Infinity;
    for (const [yStr, t] of Object.entries(yToTime)) {
      const d = Math.abs(ry - parseInt(yStr));
      if (d < bestDiff) { bestDiff = d; best = t; }
    }
    return best;
  }

  // 2. Filtra células de grade (ex: CSI990-11T)
  const codeRe = /^([A-Z]{2,5}\d{3})-\d{1,2}[TP]$/;
  const cells = items.filter(i => codeRe.test(i.text));
  if (cells.length === 0) return null;

  // 3. Agrupa por X (±20 px) → colunas de dia
  const X_TOL = 20;
  const cols = [];
  for (const cell of cells) {
    let col = cols.find(c => Math.abs(c.x - cell.x) <= X_TOL);
    if (!col) { col = { x: cell.x, cells: [] }; cols.push(col); }
    col.cells.push(cell);
  }

  // 4. Ordena colunas da esquerda para a direita (Segunda → Sábado)
  cols.sort((a, b) => a.x - b.x);

  const DAY_NAMES = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  const scheduleMap = {}; // { code: [{ day, startTime, duration }] }

  cols.forEach((col, i) => {
    const day = DAY_NAMES[i];
    if (!day) return;

    // 5. Ordena células de cima para baixo (y alto = mais cedo)
    const sorted = [...col.cells].sort((a, b) => b.y - a.y);

    let j = 0;
    while (j < sorted.length) {
      const code = sorted[j].text.match(codeRe)[1];
      const startTime = nearestTime(sorted[j].y);
      let count = 0;
      while (j + count < sorted.length && sorted[j + count].text.match(codeRe)[1] === code) count++;

      if (startTime && code) {
        if (!scheduleMap[code]) scheduleMap[code] = [];
        scheduleMap[code].push({ day, startTime, duration: count * 50 });
      }
      j += count;
    }
  });

  return Object.keys(scheduleMap).length > 0 ? scheduleMap : null;
}

// ============================================================================
// FALLBACK: extração de horários via Groq (para formatos não-UFOP)
// ============================================================================
async function extractScheduleWithGroq(text, subjects) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'sua-chave-aqui') {
    console.warn('GROQ_API_KEY não configurada — horários não serão extraídos');
    return subjects.map(s => ({ ...s, schedule: [] }));
  }

  const groq = new Groq({ apiKey });
  const subjectList = subjects.map(s => `${s.code}: ${s.name}`).join('\n');

  const prompt = `Extract the weekly class schedule from this Brazilian university enrollment PDF.
Subjects: ${subjectList}
Return ONLY a JSON array: [{"code":"CSI106","schedule":[{"day":"SEGUNDA","startTime":"21:00","duration":100}]}]
Days: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO
Document: ${text.slice(0, 3000)}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 2048
    });
    const rawText = completion.choices[0].message.content.trim();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON inválido');
    const scheduleData = JSON.parse(jsonMatch[0]);
    return subjects.map(s => {
      const found = scheduleData.find(d => d.code === s.code);
      return { ...s, schedule: found?.schedule || [] };
    });
  } catch (err) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate');
    console.error('Groq fallback falhou:', isQuota ? 'quota esgotada' : err.message);
    return subjects.map(s => ({ ...s, schedule: [], scheduleError: isQuota ? 'quota' : 'error' }));
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL: orquestra toda a extração
// ============================================================================
async function parseEnrollmentPDF(buffer) {
  const text = await extractTextFromPDF(buffer);
  const semester = extractSemester(text);
  const studentName = extractStudentName(text);
  const subjects = extractSubjectList(text);

  if (subjects.length === 0) {
    return { semester, studentName, subjects: [], rawText: text };
  }

  // Tenta extração determinística por coordenadas (rápida, gratuita, 100% precisa)
  const scheduleMap = await extractScheduleFromCoordinates(buffer);

  let subjectsWithSchedule;
  if (scheduleMap) {
    console.log('Horários extraídos por coordenadas PDF (determinístico)');
    subjectsWithSchedule = subjects.map(s => ({
      ...s,
      schedule: scheduleMap[s.code] || []
    }));
  } else {
    // Fallback para Groq (outros formatos de universidade)
    console.log('Coordenadas não disponíveis — usando Groq como fallback');
    subjectsWithSchedule = await extractScheduleWithGroq(text, subjects);
  }

  return { semester, studentName, subjects: subjectsWithSchedule };
}

module.exports = { parseEnrollmentPDF, normalizeName };
