const https = require('https');

// --- 1. SAFE LOAD THE MINION ---
let systemInstructions = "You are a helpful assistant.";
let debugLog = []; // We will collect clues here

try {
  // Try to load the file
  systemInstructions = require('../../prompt.js');
  debugLog.push("Loaded prompt.js successfully.");
} catch (e) {
  debugLog.push("Failed to load prompt.js: " + e.message);
  // Fallback to avoid crash
  systemInstructions = "You are a helpful assistant (Fallback active).";
}
// -------------------------------

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "OK" };

  return new Promise((resolve) => {
    try {
      // 2. PARSE BODY
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        throw new Error("Invalid JSON body sent from frontend.");
      }

      const fullPrompt = `Instructions: ${systemInstructions}. User Topic: ${body.topic}. User Beliefs: ${body.belief}. Write a 2-sentence affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // USING THE PREVIEW MODEL
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
            
            // 3. SUCCESS CHECK
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              resolve({ 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ affirmation: parsed.candidates[0].content.parts[0].text }) 
              });
            } else {
              // 4. API ERROR CATCHER
              // If Google returns an error, we show THAT as the affirmation
              const apiError = parsed.error ? parsed.error.message : "Unknown API Error";
              const debugMessage = `API FAILURE: ${apiError}. LOGS: ${debugLog.join(" | ")}`;
              
              resolve({ 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ affirmation: debugMessage }) 
              });
            }
          } catch (e) {
            resolve({ 
              statusCode: 200, 
              headers, 
              body: JSON.stringify({ affirmation: "RESPONSE PARSE CRASH: " + responseBody }) 
            });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ affirmation: "NETWORK CRASH: " + e.message }) 
        });
      });

      req.write(data);
      req.end();

    } catch (e) {
      // 5. GLOBAL CRASH CATCHER
      // This catches the 'undefined' cause and prints it
      resolve({ 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ affirmation: "SYSTEM CRASH: " + e.message }) 
      });
    }
  });
};