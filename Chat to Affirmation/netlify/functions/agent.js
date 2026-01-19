const https = require('https');

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  return new Promise((resolve) => {
    try {
      const body = JSON.parse(event.body);
      const topic = body.topic || "general";
      const belief = body.belief || "neutral";
      
      const prompt = `Act as an empathetic coach. Topic: ${topic}. Beliefs: ${belief}. Write a short affirmation.`;
      
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      // We use 'gemini-1.5-flash' because it is the most standard Free Tier model
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data) // FIX: Ensures exact byte count
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Success!
            const parsed = JSON.parse(responseBody);
            const text = parsed.candidates[0].content.parts[0].text;
            resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: text }) });
          } else {
            // FAILURE: But we send it as "Success" (200) so you can see the error on your screen
            console.log("Google Error:", responseBody); // Prints to Netlify Log
            resolve({ 
              statusCode: 200, // <--- FAKE SUCCESS so the website displays the text
              headers, 
              body: JSON.stringify({ affirmation: "GOOGLE ERROR: " + responseBody }) 
            });
          }
        });
      });

      req.on('error', (e) => {
        console.log("Network Error:", e.message);
        resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "NETWORK ERROR: " + e.message }) });
      });

      req.write(data);
      req.end();

    } catch (e) {
      console.log("Code Error:", e.message);
      resolve({ statusCode: 200, headers, body: JSON.stringify({ affirmation: "CODE ERROR: " + e.message }) });
    }
  });
};