const fetch = require('node-fetch');

async function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    console.log('=== Réponse brute Gemini ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('============================');

    if (data.candidates && data.candidates.length > 0) {
      // Retourne le texte contenu dans la réponse
      return data.candidates[0].content.parts[0].text || '❌ Réponse vide de Gemini.';
    }

    return '❌ Aucune réponse reçue de Gemini.';
  } catch (error) {
    console.error('❌ Erreur Gemini API :', error);
    return '❌ Une erreur est survenue lors de la communication avec Gemini.';
  }
}

module.exports = { askGemini };
