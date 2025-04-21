// backend/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { EventModel } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create Event
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      date,
      location,
      creator,
      needs,
      invitees,
      reminderMethod,
    } = req.body;

    const newEvent = new EventModel({
      name,
      description,
      date,
      location,
      creator,
      needs,
      invitees,
      reminderMethod,
      token: uuidv4(), // Unique token for guest access
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Get All Events (for dev/testing)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await EventModel.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});



export default router;

