// backend/server.ts
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import eventRoutes from './routes/eventRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Gather API 🚀');
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () =>
      console.log(`🌐 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
