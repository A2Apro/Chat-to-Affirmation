const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  // 1. Security Check: Only allow POST requests (sending data)
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Setup the AI using the secure environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Parse the incoming data from your website
    const requestBody = JSON.parse(event.body);
    const userTopic = requestBody.topic || "general";
    const userBelief = requestBody.belief || "neutral";

    // 4. The Prompt Logic
    const prompt = `
      Act as an empathetic coach.
      User Challenge: "${userTopic}"
      User Belief System: "${userBelief}"
      Generate a short, powerful affirmation.
    `;

    // 5. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. Send success response back to the browser
    return {
      statusCode: 200,
      body: JSON.stringify({ affirmation: text }),
    };

  } catch (error) {
    console.error("Agent Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};

// Force Netlify to Rebuild v1