// backend/server.ts
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import eventRoutes from './routes/eventRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Using 'dev' format for development

// Routes
app.use('/api/events', eventRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Gather API 🚀');
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Clean the events collection
    if (mongoose.connection.db) {
      const eventsCollection = mongoose.connection.db.collection('events');
      await eventsCollection.deleteMany({});
      console.log('🧹 Events collection cleaned on server restart');
    }
   
    
    app.listen(PORT, () =>
      console.log(`🌐 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
