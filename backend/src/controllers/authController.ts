import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ username });
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET(), { expiresIn: '24h' });

    res.status(201).json({ token, username: user.username });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET(), { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};
