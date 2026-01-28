const https = require('https');

exports.handler = async (event) => {
  // 1. Setup CORS Headers (Allows your website to talk to this function)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // 2. Handle Preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  return new Promise((resolve) => {
    try {
      // 3. Parse user input from the website
      const body = JSON.parse(event.body);
      const topic = body.topic || "general life";
      const belief = body.belief || "potential and growth";
      
      // 4. Create a "Dangerously Smart" Prompt
      // We explicitly tell the AI its role to get better results.
      const prompt = `SYSTEM: You are a world-class empathetic life coach. 
      USER INPUT: I want an affirmation about ${topic}. My core belief is ${belief}.
      TASK: Write a powerful, 1-2 sentence affirmation in the first person ("I am...").`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      // 5. API Configuration (FIXED MODEL NAME HERE)
      // Using 'gemini-3-flash-preview' for 2026 Free Tier speed.
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      // 6. Execute the Request
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          const parsed = JSON.parse(responseBody);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            // SUCCESS
            const text = parsed.candidates[0].content.parts[0].text;
            resolve({ 
              statusCode: 200, 
              headers, 
              body: JSON.stringify({ affirmation: text }) 
            });
          } else {
            // GOOGLE ERROR HANDLING
            console.error("Google API Error:", responseBody);
            resolve({ 
              statusCode: 200, // Send 200 so the UI can display the error message
              headers, 
              body: JSON.stringify({ 
                affirmation: `Service Update Required: ${parsed.error?.message || "Unknown Error"}` 
              }) 
            });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ affirmation: "Network Error: Please check your connection." }) 
        });
      });

      req.write(data);
      req.end();

    } catch (e) {
      resolve({ 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ affirmation: "System Error: Could not process request." }) 
      });
    }
  });
};