import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { queryGemini } from '../services/gemini';

export const handleQuery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query cannot be empty' });
      return;
    }

    const response = await queryGemini(query.trim());
    res.json({ response });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Gemini error]', err);
    if (msg.includes('DEADLINE_EXCEEDED') || msg.includes('timeout')) {
      res.status(504).json({ error: 'AI request timed out. Please try again.' });
      return;
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
      return;
    }
    res.status(500).json({ error: msg || 'Failed to get AI response. Please try again.' });
  }
};
