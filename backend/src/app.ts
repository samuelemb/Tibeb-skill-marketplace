import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import 'express-async-errors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import proposalRoutes from './routes/proposals';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import reviewRoutes from './routes/reviews';
import skillRoutes from './routes/skills';
import portfolioRoutes from './routes/portfolio';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tibeb API Documentation',
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tibeb API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
