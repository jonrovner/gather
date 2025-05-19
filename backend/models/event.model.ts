// backend/models/event.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INeed {
  _id: string;
  item: string;
  claimedBy?: string; // userId or name
  cost?: number;
  status?: 'open' | 'claimed';
}

export interface IDestination {
  _id: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  accommodation: string;
}

export interface IInvitee {
  name: string;
  emailOrPhone: string;
  invitation: 'pending' | 'sent' | 'accepted' | 'rejected';
  reminderPreference?: 'email' | 'sms';
  token?: string; 
  claimedItems?: string[]; // array of need._id that this invitee has claimed
}

export interface IBaseEvent {
  name: string;
  description?: string;
  date: Date;
  location: string;
  creator: string;
  hostName: string;
  invitees: IInvitee[];
  reminderMethod?: 'email' | 'sms';
  languagePreference?: 'en' | 'es';
  eventType: 'eatery' | 'trip' | 'bizmeet' | 'protest';
}

export interface IEatery extends IBaseEvent {
  eventType: 'eatery';
  needs: INeed[];
}

export interface ITrip extends IBaseEvent {
  eventType: 'trip';
  needs: INeed[];
  destinations: IDestination[];
}

export interface IBizmeet extends IBaseEvent {
  eventType: 'bizmeet';
  dresscode: string;
  agenda: string;
}

export interface IProtest extends IBaseEvent {
  eventType: 'protest';
  manifesto: string;
  needs: INeed[];
}

export type IEvent = IEatery | ITrip | IBizmeet | IProtest;

const NeedSchema = new Schema<INeed>({
  _id: { type: String, required: true },
  item: { type: String, required: true },
  claimedBy: String,
  cost: Number,
  status: { type: String, enum: ['open', 'claimed'], default: 'open' },
});

const DestinationSchema = new Schema<IDestination>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  arrivalDate: { type: String, required: true },
  departureDate: { type: String, required: true },
  accommodation: { type: String, required: true },
});

const InviteeSchema = new Schema<IInvitee>({
  name: { type: String, required: true },
  emailOrPhone: { type: String, required: true },
  invitation: { type: String, enum: ['pending', 'sent', 'accepted', 'rejected'], default: 'pending' },
  reminderPreference: { type: String, enum: ['email', 'sms'] },
  token: { type: String, unique: true, sparse: true }, 
  claimedItems: [{ type: String }], // array of need._id
});

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String},
    description: String,
    date: { type: Date },
    location: { type: String },
    creator: { type: String },
    hostName: { type: String},
    eventType: { type: String, enum: ['eatery', 'trip', 'bizmeet', 'protest'] },
    needs: [NeedSchema],
    destinations: [DestinationSchema],
    invitees: [InviteeSchema],
    reminderMethod: { type: String, enum: ['email', 'sms'] },
    languagePreference: { type: String, enum: ['en', 'es'], default: 'en' },
    dresscode: String,
    agenda: String,
    manifesto: String,
  },
  { timestamps: true }
);

// Create the model
export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
