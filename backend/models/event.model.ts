// backend/models/event.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INeed {
  _id: string;
  item: string;
  claimedBy?: string; // userId or name
  cost?: number;
  status?: 'open' | 'claimed';
}

export interface IInvitee {
  name: string;
  emailOrPhone: string;
  invitation: 'pending' | 'sent' | 'accepted' | 'rejected';
  reminderPreference?: 'email' | 'sms';
  token: string; // unique token for this invitee
  claimedItems?: string[]; // array of need._id that this invitee has claimed
}

export interface IEvent extends Document {
  name: string;
  description?: string;
  date: Date;
  location: string;
  creator: string; // userId
  hostName: string; // name from Auth0 user
  needs: INeed[];
  invitees: IInvitee[];
  reminderMethod?: 'email' | 'sms' | 'both';
  languagePreference: 'en' | 'es'; // supported languages
  createdAt: Date;
  updatedAt: Date;
}

const NeedSchema = new Schema<INeed>({
  _id: { type: String, required: true },
  item: { type: String, required: true },
  claimedBy: String,
  cost: Number,
  status: { type: String, enum: ['open', 'claimed'], default: 'open' },
});

const InviteeSchema = new Schema<IInvitee>({
  name: { type: String },
  emailOrPhone: { type: String },
  invitation: { type: String, enum: ['pending', 'sent', 'accepted', 'rejected'], default: 'pending' },
  reminderPreference: { type: String, enum: ['email', 'sms'] },
  token: { type: String, index: true },
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
    needs: [NeedSchema],
    invitees: [InviteeSchema],
    reminderMethod: { type: String, enum: ['email', 'sms'] },
    languagePreference: { type: String, enum: ['en', 'es'], default: 'en' },
  },
  { timestamps: true }
);

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
