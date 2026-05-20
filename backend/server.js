import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import logRoutes from './routes/logs.js';
import planRoutes from './routes/plans.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard middlewares with secure, dynamic CORS for development and deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://productive-journey-soladev83.vercel.app',
  'https://productive-journey-Soladev83.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or matching allowed origins/vercel subdomains
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Routes registration
app.use('/api/logs', logRoutes);
app.use('/api/plans', planRoutes);

// Health Check and Info Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to the Productive Journey MERN API!',
    databaseMode: global.isMongoConnected ? 'MongoDB (Mongoose)' : 'Local File Fallback (JSON database)',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Initialize database connection
const startServer = async () => {
  await connectDB();
  
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
      console.log('\x1b[34m%s\x1b[0m', '🚀 ========================================== 🚀');
      console.log('\x1b[34m%s\x1b[0m', `🔥 Server is running successfully on PORT: ${PORT}`);
      console.log('\x1b[34m%s\x1b[0m', `🔗 API Root: http://localhost:${PORT}`);
      console.log('\x1b[34m%s\x1b[0m', '🚀 ========================================== 🚀');
    });
  }
};

startServer();

export default app;
