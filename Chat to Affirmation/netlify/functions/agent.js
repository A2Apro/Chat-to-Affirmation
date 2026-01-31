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
      
      // --- THE SAFETY NET LOGIC ---
      let systemInstructions = "You are a helpful affirmation assistant."; // Default
      
      try {
        // Look for the prompt.md file in the root folder
        const promptPath = path.resolve(__dirname, '../../prompt.md');
        if (fs.existsSync(promptPath)) {
          systemInstructions = fs.readFileSync(promptPath, 'utf8');
        }
      } catch (fileError) {
        console.log("Could not read prompt.md, using default personality.");
      }
      // ----------------------------

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
            // This line specifically fixes the "undefined" error
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
