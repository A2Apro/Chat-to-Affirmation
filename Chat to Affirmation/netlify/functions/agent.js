const https = require('https');

// --- THE SIDECAR LOADER ---
// We use './' which means "look in the same folder as me"
// This is the most reliable way to link files in Node.js
let systemInstructions = "You are a helpful affirmation assistant.";

try {
  systemInstructions = require('./prompt.js');
} catch (e) {
  // If this fails, we force the error to show so you don't waste credits guessing
  systemInstructions = `CRITICAL ERROR: Could not find prompt.js in functions folder. Details: ${e.message}`;
}
// ---------------------------

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };

  return new Promise((resolve) => {
    try {
      // 1. Check for Critical Load Error immediately
      if (systemInstructions.includes("CRITICAL ERROR")) {
        resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: systemInstructions }) });
        return;
      }

      const body = JSON.parse(event.body);

      const fullPrompt = `Instructions: ${systemInstructions}. User Topic: ${body.topic}. User Beliefs: ${body.belief}. Write a 2-sentence affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // Using the Preview model since we know it works for you
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
              // If API fails, show the raw error to save debugging time
              const apiError = parsed.error ? parsed.error.message : "Unknown API Error";
              resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: `API ERROR: ${apiError}` }) });
            }
          } catch (e) {
            resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "JSON PARSE ERROR" }) });
          }
        });
      });

      req.on('error', (e) => resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "NETWORK ERROR: " + e.message }) }));
      req.write(data);
      req.end();

    } catch (e) {
      resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "CRASH: " + e.message }) });
    }
  });
};
