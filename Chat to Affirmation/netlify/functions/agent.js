const https = require('https');

// --- THE DEBUG LOADER ---
let systemInstructions = "";

try {
  // We try to load the prompt file
  systemInstructions = require('../../prompt.js');
} catch (e) {
  // IF THIS FAILS, WE WILL PRINT THE ERROR AS THE AFFIRMATION
  // This way, you will see exactly what is wrong on your screen.
  systemInstructions = `CRITICAL ERROR: Could not read prompt.js. Reason: ${e.message}`;
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

      // If the file failed to load, we skip the AI and just show the error
      if (systemInstructions.includes("CRITICAL ERROR")) {
         resolve({ 
           statusCode: 200, 
           headers, 
           body: JSON.stringify({ affirmation: systemInstructions }) 
         });
         return;
      }

      const fullPrompt = `Instructions: ${systemInstructions}. User Topic: ${body.topic}. User Beliefs: ${body.belief}. Write a 2-sentence affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // Keeping the Preview model that we know works for you
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
          try {
            const parsed = JSON.parse(responseBody);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: parsed.candidates[0].content.parts[0].text }) });
            } else {
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "The AI is currently steeping. Try again!" }) });
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