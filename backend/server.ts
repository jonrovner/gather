// backend/server.ts
import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import eventRoutes from './routes/eventRoutes';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Using 'dev' format for development

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Email sending rate limiter
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many email requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Apply rate limiting to email sending routes  
app.use('/api/events/:id/invite', emailLimiter);

// Routes
app.use('/api/events', eventRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Gather API 🚀');
});

// Error handling middleware (should be after all routes)
app.use(errorHandler);

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
