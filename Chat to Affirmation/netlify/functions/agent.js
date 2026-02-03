const https = require('https');

// --- THE TROJAN HORSE ---
// Because prompt.js is code, Netlify is forced to bundle it.
// We use a try/catch just in case, but this is 99% more reliable.
let systemInstructions = "You are a helpful affirmation assistant.";
try {
  // We look two levels up because agent.js is in netlify/functions
  systemInstructions = require('../../prompt.js');
} catch (e) {
  console.log("Could not load prompt.js, using default.");
}
// ------------------------

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };

  return new Promise((resolve) => {
    try {
      const body = JSON.parse(event.body);

      const fullPrompt = `Instructions: ${systemInstructions}. User Topic: ${body.topic}. User Beliefs: ${body.belief}. Write a 2-sentence affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-3-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "The AI is currently steeping. Try again in a moment!";
            resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
          } catch (e) {
            resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Parsing error" }) });
          }
        });
      });

      req.on('error', (e) => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
      req.write(data);
      req.end();

    } catch (e) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
    }
  });
};