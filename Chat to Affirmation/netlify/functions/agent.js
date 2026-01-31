const https = require('https');
const fs = require('fs');
const path = require('path');

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

      // --- NEW LOGIC: READ FROM PROMPT.MD ---
      // This looks for prompt.md in your main folder
      const promptPath = path.resolve(__dirname, '../../prompt.md');
      const systemInstructions = fs.readFileSync(promptPath, 'utf8');
      // --------------------------------------

      // We combine the file instructions with the user's specific topic
      const fullPrompt = `${systemInstructions}. Now, write a short, warm affirmation about ${body.topic} and their belief in ${body.belief}.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // Keeping your Gemini 3 Flash model path exactly as you have it
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
          const parsed = JSON.parse(responseBody);
          // Safety check: ensure the AI returned a response
          if (parsed.candidates && parsed.candidates[0]) {
            const text = parsed.candidates[0].content.parts[0].text;
            resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
          } else {
            resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "AI response failed" }) });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
      });

      req.write(data);
      req.end();
    } catch (e) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
    }
  });
};
