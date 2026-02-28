import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';
import { Server as SocketServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import { setupSocket } from './socket/chatSocket';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import reviewRoutes from './routes/reviewRoutes';
import paymentRoutes from './routes/paymentRoutes';
import chatRoutes from './routes/chatRoutes';
import sellerRoutes from './routes/sellerRoutes';
import voucherRoutes from './routes/voucherRoutes';
import flashSaleRoutes from './routes/flashSaleRoutes';
import searchRoutes from './routes/searchRoutes';
import aiRoutes from './routes/aiRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);
setupSocket(io);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression & logging
app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'NexMart API',
  });
});

// API Routes
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/payment`, paymentRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/seller`, sellerRoutes);
app.use(`${API}/vouchers`, voucherRoutes);
app.use(`${API}/flash-sales`, flashSaleRoutes);
app.use(`${API}/search`, searchRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/wishlist`, wishlistRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use(`${API}/admin`, adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 NexMart Server running on port ${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🤖 AI Features: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled (no API key)'}`);
});

export default app;
