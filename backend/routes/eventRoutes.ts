// backend/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { EventModel } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

interface INeed {
  _id: string;
  item: string;
  estimatedCost?: number;
  claimedBy?: string;
  status: 'open' | 'claimed';
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

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
      needs: needs.map((need: Omit<INeed, '_id'>) => ({ ...need, _id: uuidv4() })),
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

// Get Event by Token
router.get('/token', async (req: Request, res: Response) => {
  try {
    const event = await EventModel.findOne({ token: req.query.token });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event by token' });
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

    const event = await EventModel.findById(req.params.id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Update the event with new invitees
    event.invitees = [...event.invitees, ...invitees];
    await event.save();

    // TODO: Implement actual email/SMS sending logic here

    for (const invitee of invitees) {
      if (invitee.emailOrPhone && invitee.reminderPreference === 'email') {


        const invitationUrl = `${process.env.CORS_ORIGIN}/event/guest/?token=${event.token}`;


        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: invitee.emailOrPhone,
          subject: `You're invited to ${event.name}!`,
          text: `Hi! You've been invited to ${event.name} on ${event.date} at ${event.location}.
          To view the event and claim needs, click this link: ${invitationUrl}`,
        };
 
        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error(`Failed to send email to ${invitee.emailOrPhone}:`, emailErr);
          // Optionally, handle this error (e.g., continue, or return an error response)
        }
      }
    }

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

// Claim a Need
router.put<{ id: string; needId: string }>('/:id/needs/:needId/claim', async (req: Request<{ id: string; needId: string }>, res: Response) => {
  try {
    const { id, needId } = req.params;
    const { claimedBy } = req.body; // Optional: who is claiming the need

    const event = await EventModel.findById(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const need = event.needs.find(n => n._id.toString() === needId);
    if (!need) {
      res.status(404).json({ message: 'Need not found' });
      return;
    }

    // Update the need (e.g., mark as claimed)
    need.status = 'claimed';
    if (claimedBy) {
      need.claimedBy = claimedBy;
    }

    await event.save();
    res.status(200).json(need);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid event or need ID' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to claim need' });
  }
});

// Claim a Need by Token
router.put<{ token: string; needId: string }>('/token/:token/needs/:needId/claim', async (req: Request<{ token: string; needId: string }>, res: Response) => {
  try {
    const { token, needId } = req.params;
    const { claimedBy } = req.body;

    const event = await EventModel.findOne({ token });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const need = event.needs.find(n => n._id.toString() === needId);
    if (!need) {
      res.status(404).json({ message: 'Need not found' });
      return;
    }

    // Update the need
    need.status = 'claimed';
    if (claimedBy) {
      need.claimedBy = claimedBy;
    }

    await event.save();
    res.status(200).json(need);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({ message: 'Invalid event token or need ID' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to claim need' });
  }
});

export default router;

