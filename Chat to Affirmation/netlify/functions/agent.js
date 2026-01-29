const https = require('https');

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
      const prompt = `Act as an empathetic coach for Tisane Infusions. Write a short, warm affirmation about ${body.topic}.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // Updated to the 2026 Gemini 3 Free Tier model
        path: `/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          const parsed = JSON.parse(responseBody);
          const text = parsed.candidates[0].content.parts[0].text;
          resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
        });
      });

      req.write(data);
      req.end();
    } catch (e) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
    }
  });
};