// 1. Import the AI tool from the web (No "require", no build needed)
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// 2. Setup the AI
// WARNING: Since this is frontend, your API key is visible to tech-savvy users.
// For a personal test app, this is fine. For a real business app, you'd need the backend server later.
const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 3. This function runs when the user clicks your button
// Make sure your HTML button calls this function!
export async function runAgent(userTopic, userBelief) {
    
  try {
    // The "Agent" Persona (System Prompt)
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

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return the text so your UI can display it
    return text;

  } catch (error) {
    console.error("Error:", error);
    return "Something went wrong. Please check the console.";
  }
}