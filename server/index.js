import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { protect, authorize } from './middleware/authMiddleware.js';
dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/protected-test', protect, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

app.get('/api/instructor-only', protect, authorize('INSTRUCTOR', 'ADMIN'), (req, res) => {
  res.json({ message: 'You are an instructor or admin', user: req.user });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduSmart API running' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));