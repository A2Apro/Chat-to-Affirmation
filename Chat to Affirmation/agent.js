// agent.js

// 1. Import the Google AI tool directly from the web
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// 2. Initialize the AI
// REPLACE 'YOUR_API_KEY' BELOW WITH YOUR ACTUAL GEMINI API KEY
const API_KEY = "AIzaSyD_eRwhrOu_RLKKmiSy1TBNxc9GZse02ec"; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 3. This function runs when the user clicks the button
// We export it so the HTML file can see it
export async function runAgent(userTopic, userBelief) {
  try {
    const prompt = `
      You are an empathetic affirmation coach.
      User Challenge: "${userTopic}"
      User Belief: "${userBelief}"
      Generate a short, powerful affirmation for this person.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error(error);
    return "Error: Could not generate affirmation. Check console for details.";
  }
}