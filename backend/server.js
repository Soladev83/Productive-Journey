import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import logRoutes from './routes/logs.js';
import planRoutes from './routes/plans.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard middlewares
app.use(cors({
  origin: '*', // Allow connection from Vite dev server
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

// Initialize database connection and boot server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log('\x1b[34m%s\x1b[0m', '🚀 ========================================== 🚀');
    console.log('\x1b[34m%s\x1b[0m', `🔥 Server is running successfully on PORT: ${PORT}`);
    console.log('\x1b[34m%s\x1b[0m', `🔗 API Root: http://localhost:${PORT}`);
    console.log('\x1b[34m%s\x1b[0m', '🚀 ========================================== 🚀');
  });
};

startServer();
