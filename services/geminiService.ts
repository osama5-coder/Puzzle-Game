
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Witty fallback messages for when the API quota is reached
const FALLBACK_MESSAGES = [
  "Better luck next time, cadet.",
  "That was... suboptimal.",
  "Gravity: 1, Pilot: 0.",
  "Did you forget where the thrusters are?",
  "The nebula claimed another one.",
  "Engines failed? Or just talent?",
  "System report: Pilot error detected.",
  "Try hitting the spacebar, not the wall.",
  "Your flight license is being reviewed.",
  "The insurance company won't like this.",
  "Back to the simulator for you.",
  "Calculated probability of survival: 0%."
];

/**
 * Gets a sarcastic comment from Gemini. 
 * If the API fails (e.g., 429 Quota Exceeded), it gracefully falls back to a local message pool.
 */
export const getMissionControlCommentary = async (score: number, highScore: number): Promise<string> => {
  try {
    // Attempt to get a fresh roast from Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short sarcastic roast for a pilot who crashed. Score: ${score}, High: ${highScore}. Respond in English. Max 10 words.`,
      config: {
        systemInstruction: "You are a witty cyberpunk mission controller. Be extremely brief and sarcastic.",
        temperature: 1.0,
      }
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    return text;
  } catch (error: any) {
    // Log the error for developers but don't break the user experience
    console.warn("Mission Control: Switching to local emergency protocols (API Error).", error?.message);

    // Specific logic for zero-score crashes
    if (score === 0) {
      return "Engines didn't even start. Truly impressive.";
    }

    // Return a random witty fallback to maintain the game's personality during quota exhaustion
    const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
    return FALLBACK_MESSAGES[randomIndex];
  }
};
