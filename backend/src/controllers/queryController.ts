import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { queryGeminiStream } from '../services/gemini';
import Chat from '../models/Chat';

const send = (res: Response, data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

export const handleQuery = async (req: AuthRequest, res: Response): Promise<void> => {
  const { query, chatId } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Query cannot be empty' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const trimmed = query.trim();
  const startTime = Date.now();
  let fullResponse = '';

  try {
    const stream = await queryGeminiStream(trimmed);

    for await (const chunk of stream) {
      const text = chunk.text as string | undefined;
      if (text) {
        fullResponse += text;
        send(res, { chunk: text });
      }
    }

    const duration = Date.now() - startTime;

    // Persist to chat history
    let resolvedChatId = chatId as string | undefined;
    try {
      if (resolvedChatId) {
        await Chat.findByIdAndUpdate(resolvedChatId, {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: trimmed },
                { role: 'assistant', content: fullResponse, duration },
              ],
            },
          },
          updatedAt: new Date(),
        });
      } else {
        const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? '...' : '');
        const chat = await Chat.create({
          userId: req.userId,
          title,
          messages: [
            { role: 'user', content: trimmed },
            { role: 'assistant', content: fullResponse, duration },
          ],
        });
        resolvedChatId = String(chat._id);
      }
    } catch {
      // Chat save failure is non-fatal — response already streamed
    }

    send(res, { done: true, duration, chatId: resolvedChatId });
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Gemini error]', err);

    if (msg.includes('DEADLINE_EXCEEDED') || msg.includes('timeout')) {
      send(res, { error: 'AI request timed out. Please try again.' });
    } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      send(res, { error: 'API quota exceeded. Please try again later.' });
    } else {
      send(res, { error: 'Failed to get AI response. Please try again.' });
    }
    res.end();
  }
};
