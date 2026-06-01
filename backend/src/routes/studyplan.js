const express  = require('express');
const axios    = require('axios');
const pdfParse = require('pdf-parse');
const Groq     = require('groq-sdk');
const prisma   = require('../prisma');

const router = express.Router();

// POST /api/study-plan/generate
// Body: { fileIds: [1, 2, 3] }
router.post('/generate', async (req, res) => {
  try {
    const { fileIds } = req.body;
    const userId = req.userId;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um arquivo.' });
    }

    // Verifica propriedade dos arquivos
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds.map(Number) },
        professorSubject: {
          subject: { course: { userId } }
        }
      }
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'Nenhum arquivo encontrado.' });
    }

    // Baixa PDFs do Cloudinary e extrai texto
    let combinedText = '';
    const skipped = [];

    for (const file of files) {
      // Só tenta extrair de PDFs
      if (!file.url.toLowerCase().includes('.pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        skipped.push(file.name);
        continue;
      }
      try {
        const resp = await axios.get(file.url, {
          responseType: 'arraybuffer',
          timeout: 15000
        });
        const data = await pdfParse(Buffer.from(resp.data));
        const text = data.text?.trim();
        if (text) {
          combinedText += `\n\n### ${file.name} ###\n${text}`;
        }
      } catch (e) {
        console.warn(`Não foi possível processar: ${file.name}`, e.message);
        skipped.push(file.name);
      }
    }

    if (!combinedText.trim()) {
      return res.status(422).json({
        error: 'Nenhum conteúdo de texto foi extraído dos arquivos. Certifique-se de que os PDFs contêm texto (não são imagens escaneadas).'
      });
    }

    // Trunca para não estourar o contexto do modelo (~8000 chars ≈ 2000 tokens)
    const MAX_CHARS = 10000;
    if (combinedText.length > MAX_CHARS) {
      combinedText = combinedText.slice(0, MAX_CHARS)
        + '\n\n[... conteúdo truncado para caber no limite de processamento ...]';
    }

    // Chama o Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'sua-chave-aqui') {
      return res.status(503).json({ error: 'GROQ_API_KEY não configurada.' });
    }

    const groq   = new Groq({ apiKey });
    const prompt = `Você é um assistente de estudos especializado para universitários brasileiros.

Com base no material de aula a seguir, gere um material de revisão com:
1. Um RESUMO claro e objetivo (3-4 parágrafos) com os conceitos mais importantes do conteúdo
2. De 5 a 8 QUESTÕES DE REVISÃO que testem a compreensão conceitual (não só memorização), com respostas detalhadas

Regras:
- Escreva em português do Brasil
- As questões devem exigir raciocínio, não apenas reprodução
- As respostas devem ser explicativas e didáticas
- Retorne APENAS JSON válido, sem markdown nem explicação

Formato obrigatório:
{
  "summary": "resumo aqui",
  "questions": [
    { "question": "pergunta", "answer": "resposta detalhada" }
  ]
}

MATERIAL DE AULA:
${combinedText}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 3000
    });

    const raw       = completion.choices[0].message.content.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta do AI não contém JSON válido.');

    const result = JSON.parse(jsonMatch[0]);

    res.json({
      summary:   result.summary   || '',
      questions: Array.isArray(result.questions) ? result.questions : [],
      filesUsed: files.length - skipped.length,
      skipped
    });
  } catch (err) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota');
    console.error('Erro ao gerar plano de estudos:', err.message);
    res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? 'Limite da API de IA atingido. Tente novamente em alguns minutos.'
        : 'Erro ao gerar o plano de estudos. Tente novamente.'
    });
  }
});

module.exports = router;
