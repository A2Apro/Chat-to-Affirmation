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
      
      // --- UPDATED: DEEP SEARCH BUNDLE LOGIC ---
      let systemInstructions = "You are a helpful affirmation assistant.";
      
      try {
        // Attempt 1: The most reliable for Netlify 'included_files'
        const bundledPath = require.resolve('../../prompt.md');
        systemInstructions = fs.readFileSync(bundledPath, 'utf8');
      } catch (e1) {
        try {
          // Attempt 2: Check the root directory directly
          const rootPath = path.join(process.cwd(), 'prompt.md');
          if (fs.existsSync(rootPath)) {
            systemInstructions = fs.readFileSync(rootPath, 'utf8');
          }
        } catch (e2) {
          try {
            // Attempt 3: Check a relative path from the function folder
            const manualPath = path.resolve(__dirname, '../../prompt.md');
            if (fs.existsSync(manualPath)) {
              systemInstructions = fs.readFileSync(manualPath, 'utf8');
            }
          } catch (e3) {
            // If all fail, we stay with the default
            console.log("Minion file not found. Using default assistant.");
          }
        }
      }
      // ------------------------------------

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
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              const text = parsed.candidates[0].content.parts[0].text;
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
            } else {
              // This is the message you saw; it triggers if Gemini doesn't return text
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "The AI is currently steeping. Try again in a moment!" }) });
            }
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
