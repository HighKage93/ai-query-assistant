import { GoogleGenAI } from '@google/genai';

export const queryGemini = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    contents: prompt,
  });
  return response.text ?? '';
};
