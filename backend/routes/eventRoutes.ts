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
  cost?: number;
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
      hostName,
      needs = [],
      reminderMethod,
    } = req.body;

    const newEvent = new EventModel({
      name,
      description,
      date,
      location,
      creator,
      hostName,
      needs: needs.map((need: Omit<INeed, '_id'>) => ({ 
        ...need, 
        _id: uuidv4(),
        status: 'open'
      })),
      invitees: [], // Initialize with empty array
      reminderMethod,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ 
      message: 'Failed to create event',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
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

// Delete Event
router.delete<{ id: string }>('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    await EventModel.findByIdAndDelete(id); 
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
}); 


// Get Event by Invitee Token (keeping the /guest/ URL structure)
router.get('/guest/:token', async (req: Request<{ token: string }>, res: Response) => {
  try {
    const event = await EventModel.findOne({ 'invitees.token': req.params.token })
      .select('name description date location needs invitees');
      
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Find the specific invitee
    const invitee = event.invitees.find(i => i.token === req.params.token);
    if (!invitee) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    // Return event data with invitee info
    res.json({
      ...event.toObject(),
      invitee: {
        name: invitee.name,
        emailOrPhone: invitee.emailOrPhone,
        hasAccepted: invitee.hasAccepted,
        claimedItems: invitee.claimedItems
      }
    });
  } catch (err) {
    console.error('Error fetching event by invitee token:', err);
    res.status(500).json({ message: 'Failed to fetch event by invitee token' });
  }
});

// Send Event Invitations
router.post<{ id: string }>('/:id/invite', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { invitees } = req.body;

    if (!Array.isArray(invitees)) {
      res.status(400).json({ message: 'Invitees must be an array' });
      return;
    }

    const event = await EventModel.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Generate tokens for new invitees
    const newInvitees = invitees.map(invitee => ({
      ...invitee,
      token: uuidv4(),
      claimedItems: [],
      hasAccepted: false
    }));

    // Update the event with new invitees
    event.invitees = [...event.invitees, ...newInvitees];
    await event.save();

    // Send emails with individual invitee tokens
    for (const invitee of newInvitees) {
      if (invitee.emailOrPhone && invitee.reminderPreference === 'email') {
        const encodedToken = encodeURIComponent(invitee.token);
        const invitationUrl = `${process.env.CORS_ORIGIN}/event/guest/${encodedToken}`;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: invitee.emailOrPhone,
          subject: `You're invited to ${event.name}!`,
          text: `Hi ${invitee.name}! ${event.hostName} has invited you to ${event.name} on ${event.date} at ${event.location}.
          To view the event and claim needs, click this link: ${invitationUrl}
          
          Important: This invitation link is unique to you and should not be shared. It provides access to your personal invitation to ${event.name}.
          If you share this link, others could accept the invitation or claim items on your behalf.`,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error(`Failed to send email to ${invitee.emailOrPhone}:`, emailErr);
          // Continue with other invitees even if one email fails
        }
      }
    }

    res.status(200).json({ 
      message: 'Invitations sent successfully',
      invitees: newInvitees.map(({ name, emailOrPhone, token }) => ({ 
        name, 
        emailOrPhone, 
        token 
      }))
    });
  } catch (err) {
    console.error('Error sending invitations:', err);
    res.status(500).json({ 
      message: 'Failed to send invitations',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Accept Invitation
router.put<{ token: string }>('/invitee/:token/accept', async (req: Request<{ token: string }>, res: Response) => {
  try {
    const { token } = req.params;
    const { hasAccepted } = req.body;

    const event = await EventModel.findOne({ 'invitees.token': token });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const invitee = event.invitees.find(i => i.token === token);
    if (!invitee) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    invitee.hasAccepted = hasAccepted;
    await event.save();

    res.status(200).json({ message: 'Invitation accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to accept invitation' });
  }
});

// Claim a Need by Invitee Token
router.put<{ token: string; needId: string }>('/invitee/:token/needs/:needId/claim', async (req: Request<{ token: string; needId: string }>, res: Response) => {
  try {
    const { token, needId } = req.params;

    const event = await EventModel.findOne({ 'invitees.token': token });
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const invitee = event.invitees.find(i => i.token === token);
    if (!invitee) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    const need = event.needs.find(n => n._id.toString() === needId);
    if (!need) {
      res.status(404).json({ message: 'Need not found' });
      return;
    }

    if (need.status === 'claimed') {
      res.status(400).json({ message: 'Need already claimed' });
      return;
    }

    // Update the need
    need.status = 'claimed';
    need.claimedBy = invitee.name;

    // Add to invitee's claimed items
    if (!invitee.claimedItems) {
      invitee.claimedItems = [];
    }
    invitee.claimedItems.push(needId);

    await event.save();
    res.status(200).json(need);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to claim need' });
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

// Update Cost
router.put<{ id: string; needId: string }>('/:id/needs/:needId/cost', async (req: Request<{ id: string; needId: string }>, res: Response) => {
  try {
    const { id, needId } = req.params;
    const { cost } = req.body;  

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

    need.cost = cost;
    await event.save();
    res.status(200).json(need);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update cost' });
  }
});

export default router;

