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
    // 2. DIAGNOSTIC: List all available models
    // We are NOT generating text. We are asking "What works?"
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
    
    // Check if key is missing before we even start
    if (!apiKey) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "API Key is Missing in Netlify!" }) });
      return;
    }

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models?key=${apiKey}`, // <--- This asks for the list
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          // SUCCESS: Google talked back! Let's see the list.
          resolve({
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              message: "Connection Successful!", 
              models: JSON.parse(responseBody) 
            })
          });
        } else {
          // FAILURE: Google rejected the key or the URL.
          resolve({ 
            statusCode: res.statusCode, 
            headers, 
            body: JSON.stringify({ 
              error: "Google Connection Failed", 
              status: res.statusCode,
              details: responseBody 
            }) 
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Network Error", message: e.message }) });
    });

    req.end();
  });
};