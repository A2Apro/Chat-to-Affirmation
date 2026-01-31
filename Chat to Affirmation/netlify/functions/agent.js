const https = require('https');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  // 1. Setup Security Headers (CORS)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle pre-flight browser checks
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };

  return new Promise((resolve) => {
    try {
      const body = JSON.parse(event.body);
      
      // --- THE BULLETPROOF BUNDLE LOGIC ---
      // This sets a backup personality in case the file is missing
      let systemInstructions = "You are a helpful affirmation assistant.";
      
      try {
        // We use require.resolve to find the file inside the Netlify zip bundle
        const promptPath = require.resolve('../../prompt.md');
        if (fs.existsSync(promptPath)) {
          systemInstructions = fs.readFileSync(promptPath, 'utf8');
        }
      } catch (fileError) {
        // Backup: Try looking in the Current Working Directory
        try {
          const flatPath = path.join(process.cwd(), 'prompt.md');
          if (fs.existsSync(flatPath)) {
            systemInstructions = fs.readFileSync(flatPath, 'utf8');
          }
        } catch (e) {
          console.log("Could not locate prompt.md. Using default assistant.");
        }
      }
      // ------------------------------------

      // 2. Build the Full Prompt for Gemini 3 Flash
      const fullPrompt = `Instructions: ${systemInstructions}. User Topic: ${body.topic}. User Beliefs: ${body.belief}. Write a 2-sentence affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      // 3. Configure the HTTPS Request to Google
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-3-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      // 4. Send the Request
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            
            // Check if AI actually sent text back
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              const text = parsed.candidates[0].content.parts[0].text;
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
            } else {
              // This is the "Safety Message" if the AI returns something weird
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
