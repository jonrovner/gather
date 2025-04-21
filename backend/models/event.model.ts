// backend/models/event.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INeed {
  item: string;
  claimedBy?: string; // userId or name
  estimatedCost?: number;
  status?: 'open' | 'claimed';
}

export interface IInvitee {
  name: string;
  emailOrPhone: string;
  hasAccepted?: boolean;
  reminderPreference?: 'email' | 'sms';
}

export interface IEvent extends Document {
  name: string;
  description?: string;
  date: Date;
  location: string;
  creator: string; // userId
  needs: INeed[];
  invitees: IInvitee[];
  reminderMethod?: 'email' | 'sms' | 'both';
  token: string; // for guest access
  createdAt: Date;
  updatedAt: Date;
}

const NeedSchema = new Schema<INeed>({
  item: { type: String, required: true },
  claimedBy: String,
  estimatedCost: Number,
  status: { type: String, enum: ['open', 'claimed'], default: 'open' },
});

const InviteeSchema = new Schema<IInvitee>({
  name: { type: String, required: true },
  emailOrPhone: { type: String, required: true },
  hasAccepted: { type: Boolean, default: false },
  reminderPreference: { type: String, enum: ['email', 'sms'] },
});

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    location: { type: String, required: true },
    creator: { type: String, required: true },
    needs: [NeedSchema],
    invitees: [InviteeSchema],
    reminderMethod: { type: String, enum: ['email', 'sms', 'both'] },
    token: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
