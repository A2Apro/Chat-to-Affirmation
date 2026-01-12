const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  // 1. Setup the AI with your secure key
  // (We will set the actual key in Netlify settings later)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 2. Parse the data sent from the frontend
    const requestBody = JSON.parse(event.body);
    
    // We grab the topic AND the belief system here
    const userTopic = requestBody.topic || "general peace";
    const userBelief = requestBody.belief || "general spiritual";

    // 3. The "Agent" Persona (System Prompt)
    // We tell the AI to strictly adapt its style to the user's belief.
    const prompt = `
      You are an empathetic and adaptive affirmation coach. 
      
      INPUTS:
      - User's Challenge: "${userTopic}"
      - User's Belief System/Tradition: "${userBelief}"

      INSTRUCTIONS:
      1. Generate a powerful affirmation relevant to the challenge.
      2. STRICTLY ADAPT the tone, vocabulary, and style to match the user's "${userBelief}" tradition.
      3. If the user lists a specific religion (e.g., Catholic), use appropriate terminology (e.g., Grace, God, Faith).
      4. If the user lists "Metaphysics," focus on energy, vibration, and alignment.
      5. Keep it supportive, concise, and deeply personal.
    `;

    // 4. Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ affirmation: text }),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};