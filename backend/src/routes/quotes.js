const express = require('express');
const Groq    = require('groq-sdk');

const router = express.Router();

// Cache em memória: { periodId, text, author, attribution }
let quoteCache = null;

function currentPeriodId() {
  // Muda a cada 12 horas
  return Math.floor(Date.now() / (12 * 60 * 60 * 1000));
}

async function fetchQuoteFromGroq(periodId) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'sua-chave-aqui') {
    return null;
  }

  const groq = new Groq({ apiKey });

  const prompt = `Você é um gerador de frases motivacionais acadêmicas.
Gere UMA frase inspiradora sobre educação, aprendizado ou conhecimento para um estudante universitário brasileiro.
A frase DEVE ser em português do Brasil.
A frase deve ser de uma pessoa famosa real (brasileira ou internacional).
Use o identificador de período ${periodId} como semente para variar a frase a cada 12 horas.

Retorne APENAS JSON válido, sem markdown, sem explicação:
{"text": "frase aqui", "author": "Nome do Autor", "attribution": "CONTEXTO BREVE EM MAIÚSCULAS"}

Exemplos de formato de attribution: "FILÓSOFO GREGO", "EDUCADORA BRASILEIRA", "ESCRITOR AMERICANO"`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  const raw = completion.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON inválido');
  return JSON.parse(jsonMatch[0]);
}

// GET /api/quotes/daily — público, sem auth
router.get('/daily', async (req, res) => {
  try {
    const periodId = currentPeriodId();

    // Retorna do cache se o período ainda for o mesmo
    if (quoteCache && quoteCache.periodId === periodId) {
      return res.json(quoteCache.quote);
    }

    // Busca nova frase via Groq
    const quote = await fetchQuoteFromGroq(periodId);

    if (!quote) {
      // Fallback estático se Groq não estiver configurado
      return res.json({
        text: '"A educação é a arma mais poderosa que você pode usar para mudar o mundo."',
        author: 'Nelson Mandela',
        attribution: 'LÍDER E ATIVISTA SUL-AFRICANO',
      });
    }

    // Salva no cache
    quoteCache = { periodId, quote };
    res.json(quote);
  } catch (err) {
    console.error('Erro ao buscar frase do dia:', err.message);
    // Fallback em caso de erro
    res.json({
      text: '"Diga-me e eu esquecerei. Ensine-me e eu lembrarei. Envolva-me e eu aprenderei."',
      author: 'Benjamin Franklin',
      attribution: 'CIENTISTA E ESTADISTA AMERICANO',
    });
  }
});

module.exports = router;
