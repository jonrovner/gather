import mongoose from 'mongoose';
import { EventModel, IEvent, INeed, IInvitee } from '../event.model';

describe('Event Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await EventModel.deleteMany({});
  });

  it('should create & save eatery event successfully', async () => {
    const validEvent = new EventModel({
      name: 'Test Event',
      description: 'Test Description',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'eatery',
      needs: [{
        _id: 'need1',
        item: 'Test Item',
        status: 'open'
      }],
      invitees: [{
        name: 'Test Invitee',
        emailOrPhone: 'test@example.com',
        invitation: 'pending',
        token: 'token123'
      }],
      languagePreference: 'en'
    });

    const savedEvent = await validEvent.save();
    expect(savedEvent._id).toBeDefined();
    expect(savedEvent.name).toBe(validEvent.name);
    expect(savedEvent.eventType).toBe('eatery');
    if ('needs' in savedEvent) {
      expect(savedEvent.needs[0].item).toBe('Test Item');
    }
    expect(savedEvent.invitees[0].name).toBe('Test Invitee');
  });

  it('should create & save trip event successfully', async () => {
    const validEvent = new EventModel({
      name: 'Test Trip',
      description: 'Test Trip Description',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'trip',
      destination: 'Test Destination',
      departure: '2024-03-20',
      return: '2024-03-25',
      needs: [{
        _id: 'need1',
        item: 'Test Item',
        status: 'open'
      }],
      invitees: [{
        name: 'Test Invitee',
        emailOrPhone: 'test@example.com',
        invitation: 'pending'
      }],
      languagePreference: 'en'
    });

    const savedEvent = await validEvent.save();
    expect(savedEvent._id).toBeDefined();
    expect(savedEvent.eventType).toBe('trip');
    if ('destination' in savedEvent) {
      expect(savedEvent.destination).toBe('Test Destination');
    }
  });

  it('should create & save bizmeet event successfully', async () => {
    const validEvent = new EventModel({
      name: 'Test Business Meeting',
      description: 'Test Meeting Description',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'bizmeet',
      dresscode: 'Business Casual',
      agenda: 'Test Agenda',
      invitees: [{
        name: 'Test Invitee',
        emailOrPhone: 'test@example.com',
        invitation: 'pending'
      }],
      languagePreference: 'en'
    });

    const savedEvent = await validEvent.save();
    expect(savedEvent._id).toBeDefined();
    expect(savedEvent.eventType).toBe('bizmeet');
    if ('dresscode' in savedEvent) {
      expect(savedEvent.dresscode).toBe('Business Casual');
    }
  });

  it('should fail to save event without required fields', async () => {
    const eventWithoutRequiredField = new EventModel({
      name: 'Test Event',
      // missing required fields including eventType
    });

    let err;
    try {
      await eventWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });

  it('should validate needs schema correctly', async () => {
    const eventWithInvalidNeed = new EventModel({
      name: 'Test Event',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'eatery',
      needs: [{
        // missing required _id and item
        status: 'open'
      }],
      invitees: [],
      languagePreference: 'en'
    });

    let err;
    try {
      await eventWithInvalidNeed.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });

  it('should validate invitees schema correctly', async () => {
    const eventWithInvalidInvitee = new EventModel({
      name: 'Test Event',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'eatery',
      needs: [],
      invitees: [{
        // missing required fields
        invitation: 'pending'
      }],
      languagePreference: 'en'
    });

    let err;
    try {
      await eventWithInvalidInvitee.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });

  it('should validate enum values correctly', async () => {
    const eventWithInvalidEnum = new EventModel({
      name: 'Test Event',
      date: new Date(),
      location: 'Test Location',
      creator: 'user123',
      hostName: 'Test Host',
      eventType: 'eatery',
      needs: [],
      invitees: [],
      languagePreference: 'fr', // invalid language
      reminderMethod: 'invalid' // invalid reminder method
    });

    let err;
    try {
      await eventWithInvalidEnum.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });
}); 