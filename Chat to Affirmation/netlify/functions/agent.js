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

  return new Promise((resolve, reject) => {
    // 1. Get the API Key
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

    // 2. Ask Google for the list of models
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models?key=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(responseBody);
          // 3. THIS IS THE CHANGE: Send the list back as the "affirmation"
          // so you can see it on your screen.
          const modelList = data.models.map(m => m.name).join(", ");
          
          resolve({
            statusCode: 200,
            headers,
            body: JSON.stringify({ affirmation: "MODELS FOUND: " + modelList })
          });
        } else {
          resolve({ 
            statusCode: res.statusCode, 
            headers, 
            body: JSON.stringify({ affirmation: "Error: " + responseBody }) 
          });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ affirmation: "Network Error: " + e.message }) });
    });
    
    req.end();
  });
};