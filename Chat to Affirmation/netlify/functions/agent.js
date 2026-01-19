const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  // 1. DEFINE HEADERS: This is the "Permission Slip" needed for CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",       // Allow requests from any website
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // 2. HANDLE PRE-FLIGHT: Browsers ask "Can I send data?" before actually doing it.
  // We must say "Yes" (200 OK) to this "OPTIONS" request.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK"
    };
  }

  // 3. Security Check: Only allow POST requests for the actual data
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers, // Attach headers here too
      body: "Method Not Allowed" 
    };
  }

  try {
    // 4. Setup the AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 5. Parse the incoming data
    const requestBody = JSON.parse(event.body);
    const userTopic = requestBody.topic || "general";
    const userBelief = requestBody.belief || "neutral";

    // 6. The Prompt Logic
    const prompt = `
      Act as an empathetic coach.
      User Challenge: "${userTopic}"
      User Belief System: "${userBelief}"
      Generate a short, powerful affirmation.
    `;

    // 7. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = result.response.text(); // Use result.response.text() directly

    // 8. Send success response back to the browser
    return {
      statusCode: 200,
      headers, // <--- Attach headers to the success message
      body: JSON.stringify({ affirmation: text }),
    };

  } catch (error) {
    console.error("Agent Error:", error);
    return { 
      statusCode: 500, 
      headers, // <--- Attach headers to the error message so you can see it in browser
      body: JSON.stringify({ error: error.message }) 
    };
  }
};