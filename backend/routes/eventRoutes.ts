// backend/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { EventModel } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

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

    const token = uuidv4(); // Unique token for guest access
    const newEvent = new EventModel({
      name,
      description,
      date,
      location,
      creator,
      needs,
      invitees,
      reminderMethod,
      token,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Get All Events (for dev/testing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { creator } = req.query;
    let query = {};
    
    if (creator) {
      query = { creator };
    }
    
    const events = await EventModel.find(query);
    //console.log('events', events);
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get Event by ID
router.get<{ id: string }>('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }
    
    res.json(event);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Send Event Invitations
router.post<{ id: string }>('/:id/invite', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { invitees } = req.body;

    // Validate invitees data
    if (!Array.isArray(invitees)) {
      res.status(400).json({ message: 'Invitees must be an array' });
      return;
    }

    for (const invitee of invitees) {
      if (!invitee.emailOrPhone) {
        res.status(400).json({ message: 'Each invitee must have an email or phone number' });
        return;
      }
      if (invitee.reminderPreference && !['email', 'sms'].includes(invitee.reminderPreference)) {
        res.status(400).json({ message: 'Reminder preference must be either "email" or "sms"' });
        return;
      }
    }

    const event = await EventModel.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Update the event with new invitees
    event.invitees = [...event.invitees, ...invitees];
    await event.save();

    // TODO: Implement actual email/SMS sending logic here
    // For now, we'll just return success
    res.status(200).json({ message: 'Invitations sent successfully' });
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to send invitations' });
  }
});

// Update Event
router.put<{ id: string }>('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const {
      name,
      description,
      date,
      location,
      needs,
    } = req.body;

    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Update event fields
    event.name = name;
    event.description = description;
    event.date = date;
    event.location = location;
    event.needs = needs;

    await event.save();
    res.status(200).json(event);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

export default router;

