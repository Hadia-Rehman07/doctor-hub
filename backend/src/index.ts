import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes        from './routes/auth.routes';
import doctorRoutes      from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import paymentRoutes     from './routes/payment.routes';
import historyRoutes     from './routes/history.routes';
import adminRoutes       from './routes/admin.routes';
import clinicRoutes      from './routes/clinic.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ─── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`,         authLimiter, authRoutes);
app.use(`${API}/doctors`,      doctorRoutes);
app.use(`${API}/appointments`, appointmentRoutes);
app.use(`${API}/payments`,     paymentRoutes);
app.use(`${API}/history`,      historyRoutes);
app.use(`${API}/admin`,        adminRoutes);
app.use(`${API}/clinics`,      clinicRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log(`\n🚀  Doctor Hub API running on port ${PORT}`);
  console.log(`    Environment : ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`    Health check: http://localhost:${PORT}/health\n`);
});

export default app;
