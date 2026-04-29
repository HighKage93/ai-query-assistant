import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import queryRoutes from './routes/query';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));
app.use('/api/query', rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth', authRoutes);
app.use('/api', queryRoutes);
app.use('/api', chatRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
