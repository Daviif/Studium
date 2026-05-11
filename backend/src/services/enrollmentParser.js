const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
// EXTRAÇÃO DE HORÁRIOS VIA CLAUDE API
// Envia o texto do PDF e pede JSON com schedule por matéria
// ============================================================================
async function extractScheduleWithGemini(text, subjects) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'sua-chave-aqui') {
    console.warn('GEMINI_API_KEY não configurada — horários não serão extraídos');
    return subjects.map(s => ({ ...s, schedule: [] }));
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const subjectList = subjects.map(s => `${s.code}: ${s.name}`).join('\n');

  const prompt = `You are analyzing an enrollment attestation (atestado de matrícula) from UFOP, a Brazilian federal university that uses the SIGAA system.

Extract the weekly class schedule for each subject listed below.

SUBJECTS TO FIND:
${subjectList}

UFOP TIME SLOTS:
Morning (M): M1=07:30, M2=08:20, M3=09:20, M4=10:10, M5=11:10, M6=12:00
Afternoon (T): T1=13:30, T2=14:20, T3=15:20, T4=16:10, T5=17:10, T6=18:00
Night (N): N1=19:00, N2=19:50, N3=21:00, N4=21:50

Each subject usually occupies 2 consecutive periods per day (= 100 minutes per session). Look at the schedule grid in the document (top section with day columns) to determine which days each subject code appears.

Return ONLY a valid JSON array with no markdown, no explanation:
[
  {
    "code": "CSI106",
    "schedule": [
      {"day": "SEGUNDA", "startTime": "15:20", "duration": 100},
      {"day": "QUARTA", "startTime": "15:20", "duration": 100}
    ]
  }
]

Day values must be exactly one of: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO

DOCUMENT:
${text}`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Extrai o JSON mesmo que venha com delimitadores de markdown
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Resposta do Gemini não contém JSON válido');

    const scheduleData = JSON.parse(jsonMatch[0]);

    return subjects.map(subject => {
      const found = scheduleData.find(s => s.code === subject.code);
      return { ...subject, schedule: found?.schedule || [] };
    });
  } catch (err) {
    console.error('Erro ao extrair horários com Gemini:', err.message);
    return subjects.map(s => ({ ...s, schedule: [] }));
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

  const subjectsWithSchedule = await extractScheduleWithGemini(text, subjects);

  return {
    semester,
    studentName,
    subjects: subjectsWithSchedule,
    rawText: text
  };
}

module.exports = { parseEnrollmentPDF, normalizeName };
