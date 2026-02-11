
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMissionControlCommentary = async (score: number, highScore: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short sarcastic roast for a pilot who crashed. Score: ${score}, High: ${highScore}. Respond in English. Max 10 words.`,
      config: {
        systemInstruction: "You are a witty cyberpunk mission controller. Be extremely brief.",
        temperature: 1.0,
      }
    });

    return response.text?.trim() || "Better luck next time, cadet.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return score === 0 ? "Engines didn't even start." : "System failure. Retry.";
  }
};
