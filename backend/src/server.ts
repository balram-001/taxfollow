import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { verifyEmailConnection } from './utils/sendEmail';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'https://taxfollow.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header include health checks and server-to-server calls.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectDB();

verifyEmailConnection()
  .then(() => console.log('Email SMTP connection verified.'))
  .catch((error: any) => console.error(`Email SMTP is not ready: ${error.message}`));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);

// Root route (Fixes UptimeRobot 404)
app.get('/', (_req, res) => {
  res.status(200).send('TaxFollow Backend is Live & Running! 🚀');
});

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'TaxFollow Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 TaxFollow Server running on port ${PORT}`);
});
