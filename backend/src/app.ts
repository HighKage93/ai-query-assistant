import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import queryRoutes from './routes/query';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', queryRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-query-assistant')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

export default app;
