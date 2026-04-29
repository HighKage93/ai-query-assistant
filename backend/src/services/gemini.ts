import { GoogleGenAI } from '@google/genai';

const model = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const client = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const queryGemini = async (prompt: string): Promise<string> => {
  const response = await client().models.generateContent({
    model: model(),
    contents: prompt,
  });
  return response.text ?? '';
};

export const queryGeminiStream = (prompt: string) =>
  client().models.generateContentStream({
    model: model(),
    contents: prompt,
  });
