import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

global.isMongoConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/productive_journey';
  
  console.log('\x1b[36m%s\x1b[0m', '🔄 [Database] Attempting to connect to MongoDB...');

  try {
    // Set a short timeout (2.5 seconds) so the app doesn't hang if MongoDB is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500,
    });
    global.isMongoConnected = true;
    console.log('\x1b[32m%s\x1b[0m', '✅ [Database] Connected successfully to MongoDB!');
  } catch (error) {
    global.isMongoConnected = false;
    console.log('\x1b[33m%s\x1b[0m', '⚠️  [Database] MongoDB connection failed or service not running.');
    console.log('\x1b[35m%s\x1b[0m', '🚀 [Database] Gracefully falling back to local JSON database (backend/data/db.json).');
    console.log('\x1b[35m%s\x1b[0m', '   (To use MongoDB, ensure a local instance is running or set MONGODB_URI in backend/.env)');
  }
};
