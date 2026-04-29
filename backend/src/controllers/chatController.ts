import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Chat from '../models/Chat';

export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(chats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

export const getChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }
    res.json(chat);
  } catch {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
