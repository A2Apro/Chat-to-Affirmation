const https = require('https');

exports.handler = async (event) => {
  // 1. Setup CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  return new Promise((resolve, reject) => {
    try {
      // 2. Parse Data
      const body = JSON.parse(event.body);
      const topic = body.topic || "general";
      const belief = body.belief || "neutral";
      
      const prompt = `Act as an empathetic coach. Topic: ${topic}. Beliefs: ${belief}. Write a short affirmation.`;
      
      // 3. Prepare the data for Google
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      // 4. Configure the request (Standard 'gemini-1.5-flash')
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      // 5. Send the request (Native Node.js)
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseBody);
              const text = parsed.candidates[0].content.parts[0].text;
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({ affirmation: text })
              });
            } catch (e) {
              resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Parse Error", details: responseBody }) });
            }
          } else {
            // This will show us the REAL error from Google (e.g., Key Invalid)
            resolve({ statusCode: res.statusCode, headers, body: JSON.stringify({ error: "Google API Error", details: responseBody }) });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Network Error", message: e.message }) });
      });

      req.write(data);
      req.end();

    } catch (e) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Code Error", message: e.message }) });
    }
  });
};