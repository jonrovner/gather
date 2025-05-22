// backend/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { EventModel, IEvent, IEatery, ITrip, IProtest, INeed, IInvitee, IDestination } from '../models/event.model';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Recipient, EmailParams, MailerSend, Sender } from 'mailersend';
import dotenv from 'dotenv';
import { auth } from 'express-oauth2-jwt-bearer';
import { createEventValidation } from '../validations/eventValidations';
import { validate } from '../middleware/validation';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';

dotenv.config();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Add EventDocument type definition
type EventDocument = mongoose.Document & IEvent;

const mailersend = new MailerSend({
  apiKey: process.env.MAILER_TOKEN || '',
});

// Add a default "from" address using a verified domain
const DEFAULT_FROM_EMAIL = 'noreply@juntadita.com'; // Using your verified domain
const DEFAULT_FROM_NAME = 'Juntadita';

const defaultSender = new Sender(DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME);

type SupportedLanguage = 'en' | 'es';

// Email templates for different languages
const emailTemplates: Record<SupportedLanguage, {
  subject: (eventName: string) => string;
  body: (inviteeName: string, hostName: string, eventName: string, eventDate: string, eventLocation: string, invitationUrl: string) => string;
}> = {
  en: {
    subject: (eventName: string) => `You're invited to ${eventName}!`,
    body: (inviteeName: string, hostName: string, eventName: string, eventDate: string, eventLocation: string, invitationUrl: string) => 
      `Hi ${inviteeName}! ${hostName} has invited you to ${eventName} on ${eventDate} at ${eventLocation}.
      To view the event and claim needs, click this link: ${invitationUrl}
      
      Important: This invitation link is unique to you and should not be shared. It provides access to your personal invitation to ${eventName}.
      If you share this link, others could accept the invitation or claim items on your behalf.`
  },
  es: {
    subject: (eventName: string) => `¡Estás invitado a ${eventName}!`,
    body: (inviteeName: string, hostName: string, eventName: string, eventDate: string, eventLocation: string, invitationUrl: string) => 
      `¡Hola ${inviteeName}! ${hostName} te ha invitado a ${eventName} el ${eventDate} en ${eventLocation}.
      Para ver el evento y aportar a las necesidades, haz clic en este enlace: ${invitationUrl}
      
      Importante: Este enlace de invitación es único para ti y no debe compartirse. Proporciona acceso a tu invitación personal a ${eventName}.
      Si compartes este enlace, otros podrían aceptar la invitación o reclamar artículos en tu nombre.`
  }
};

const router = Router();

// Add type guards at the top of the file after imports
function hasNeeds(event: IEvent): event is IEatery | ITrip | IProtest {
  return 'needs' in event;
}

// Create Event
router.post('/', validate(createEventValidation), asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    date,
    location,
    creator,
    hostName,
    eventType,
    needs = [],
    reminderMethod,
    languagePreference = 'en',
    destinations = [],
    dresscode,
    agenda,
    manifesto,
  } = req.body;

  const baseEvent = {
    name,
    description,
    date,
    location,
    creator,
    hostName,
    eventType,
    needs: needs.map((need: Omit<INeed, '_id'>) => ({ 
      ...need, 
      _id: uuidv4(),
      status: 'open'
    })),
    invitees: [],
    reminderMethod,
    languagePreference,
  };

  // Add type-specific fields
  const eventData = {
    ...baseEvent,
    ...(eventType === 'trip' && { 
      destinations: destinations.map((dest: Omit<IDestination, '_id'>) => ({
        ...dest,
        _id: uuidv4()
      }))
    }),
    ...(eventType === 'bizmeet' && { dresscode, agenda }),
    ...(eventType === 'protest' && { manifesto }),
  };
  
  const newEvent = new EventModel(eventData);
  await newEvent.save();
  res.status(201).json(newEvent);
}));

// Get All Events (for dev/testing)
router.get('/', checkJwt, async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.payload.sub;
    if (!userId) {
      res.status(401).json({ message: 'User ID not found in token' });
      return;
    }
    const query = { creator: userId };

    const events = await EventModel.find(query);
    //console.log('events', events);
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});


// Get Event by ID
router.get<{ id: string }>('/:id', checkJwt, async (req: Request<{ id: string }>, res: Response) => {
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


// Get Event by Invitee Token
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
        invitation: invitee.invitation,
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
    const newInvitees: IInvitee[] = invitees.map(invitee => ({
      name: invitee.name,
      emailOrPhone: invitee.emailOrPhone,
      token: uuidv4(),
      invitation: 'sent' as const,
      reminderPreference: invitee.reminderPreference || 'email',
      claimedItems: []
    }));

    const filteredInvitees = newInvitees.filter(invitee => !event.invitees.some(i => i.emailOrPhone === invitee.emailOrPhone));

    // Add new invitees to the event
    event.invitees = [...event.invitees, ...filteredInvitees];
    await event.save();

    // Send emails to all new invitees
    for (const invitee of newInvitees) {
      if (invitee.emailOrPhone && invitee.reminderPreference === 'email' && invitee.token) {
        const encodedToken = encodeURIComponent(invitee.token);
        const invitationUrl = `${process.env.CORS_ORIGIN}/event/guest/${encodedToken}`;
        const language = event.languagePreference || 'en';
        const template = emailTemplates[language as SupportedLanguage];
        const formattedDate = event.date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const recipients = [new Recipient(invitee.emailOrPhone, invitee.name)];
        
        const emailParams = new EmailParams()
          .setFrom(defaultSender)
          .setTo(recipients)
          .setSubject(template.subject(event.name))
          .setText(template.body(
            invitee.name,
            event.hostName,
            event.name,
            formattedDate,
            event.location,
            invitationUrl
          ));

        try {
          await mailersend.email.send(emailParams);
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
  console.log('req.body', req.body);
  try {
    const { token } = req.params;
    const { invitation } = req.body;

    if (invitation !== 'accepted') {
      res.status(400).json({ message: 'Invalid invitation status' });
      return;
    }

    const event = await EventModel.findOne({ 'invitees.token': token }) as EventDocument;
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const invitee = event.invitees.find((i: IInvitee) => i.token === token);
    if (!invitee) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    invitee.invitation = invitation;
    await event.save();

    res.status(200).json({ message: `Invitation ${invitation} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update invitation status' });
  }
});

// Claim a Need by Invitee Token
router.put<{ token: string; needId: string }>('/invitee/:token/needs/:needId/claim', async (req: Request<{ token: string; needId: string }>, res: Response) => {
  try {
    const { token, needId } = req.params;

    const event = await EventModel.findOne({ 'invitees.token': token }) as EventDocument;
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (!hasNeeds(event)) {
      res.status(400).json({ message: 'This event type does not support needs' });
      return;
    }

    const invitee = event.invitees.find((i: IInvitee) => i.token === token);
    if (!invitee) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    const need = event.needs.find((n: INeed) => n._id.toString() === needId);
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

    const event = await EventModel.findById(req.params.id) as EventDocument;
    
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Update event fields
    event.name = name;
    event.description = description;
    event.date = date;
    event.location = location;
    
    if (hasNeeds(event)) {
      event.needs = needs;
    }

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
    const { claimedBy } = req.body;

    const event = await EventModel.findById(id) as EventDocument;
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (!hasNeeds(event)) {
      res.status(400).json({ message: 'This event type does not support needs' });
      return;
    }

    const need = event.needs.find((n: INeed) => n._id.toString() === needId);
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

    const event = await EventModel.findById(id) as EventDocument;
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    } 

    if (!hasNeeds(event)) {
      res.status(400).json({ message: 'This event type does not support needs' });
      return;
    }

    const need = event.needs.find((n: INeed) => n._id.toString() === needId);
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

// Send Payment Request Email
router.post<{ id: string }>('/:id/payment-request', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { amount, recipient, recipientEmail, eventName, hostName, hostEmail } = req.body;

    const recipients = [new Recipient(recipientEmail, recipient)];
    
    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setSubject(`Payment Request for ${eventName}`)
      .setText(`Hi ${recipient},

${hostName} has requested payment for ${eventName}.

Amount due: $${amount.toFixed(2)}

Please send the payment to:
${hostName}
${hostEmail}

Thank you for your prompt payment!

Best regards,
The Gather Team`);

    await mailersend.email.send(emailParams);
    res.status(200).json({ message: 'Payment request email sent successfully' });
  } catch (err) {
    console.error('Error sending payment request email:', err);
    res.status(500).json({ message: 'Failed to send payment request email' });
  }
});

// Remove Invitee by Token
router.delete<{ token: string }>('/invitee/:token', checkJwt, async (req: Request<{ token: string }>, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.auth?.payload.sub;

    if (!userId) {
      res.status(401).json({ message: 'User ID not found in token' });
      return;
    }

    const event = await EventModel.findOne({ 'invitees.token': token }) as EventDocument;
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Check if the user is the event creator
    if (event.creator !== userId) {
      res.status(403).json({ message: 'Only the event creator can remove invitees' });
      return;
    }

    const inviteeIndex = event.invitees.findIndex((i: IInvitee) => i.token === token);
    if (inviteeIndex === -1) {
      res.status(404).json({ message: 'Invitee not found' });
      return;
    }

    // Remove the invitee from the array
    event.invitees.splice(inviteeIndex, 1);
    await event.save();

    res.status(200).json({ message: 'Invitee removed successfully' });
  } catch (err) {
    console.error('Error removing invitee:', err);
    res.status(500).json({ message: 'Failed to remove invitee' });
  }
});

export default router;

