// Remove the library import since we are doing it manually
// const { GoogleGenerativeAI } = require("@google/generative-ai"); 

exports.handler = async (event) => {
  // 1. SETUP CORS (The Permission Slips)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // 2. Handle the "Can I talk to you?" check
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    // 3. Parse the user's data
    const requestBody = JSON.parse(event.body);
    const topic = requestBody.topic || "general";
    const belief = requestBody.belief || "neutral";
    
    // 4. Construct the Prompt
    const promptText = `Act as an empathetic coach. Topic: ${topic}. Beliefs: ${belief}. Write a short affirmation.`;

    // 5. THE MANUAL OVERRIDE: Direct Fetch to Google
    // We type the URL manually so it CANNOT be wrong.
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    // 6. Check if Google is happy
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API Error: ${errorText}`);
    }

    // 7. Extract the answer manually
    const data = await response.json();
    const affirmation = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ affirmation: affirmation }),
    };

  } catch (error) {
    console.error("Manual Override Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};