import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectDB();

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