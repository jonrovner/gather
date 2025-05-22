import { body } from 'express-validator';

export const createEventValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Event name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('date')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  
  body('creator')
    .notEmpty()
    .withMessage('Creator ID is required'),
  
  body('hostName')
    .trim()
    .notEmpty()
    .withMessage('Host name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Host name must be between 2 and 100 characters'),
  
  body('eventType')
    .trim()
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(['eatery', 'trip', 'bizmeet', 'protest'])
    .withMessage('Invalid event type'),
  
  body('needs')
    .optional()
    .isArray()
    .withMessage('Needs must be an array'),
  
  body('needs.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Need name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Need name must be between 3 and 100 characters'),
  
  body('needs.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reminderMethod')
    .optional()
    .isIn(['email', 'sms', 'both'])
    .withMessage('Invalid reminder method'),
  
  body('languagePreference')
    .optional()
    .isIn(['en', 'es'])
    .withMessage('Language preference must be either "en" or "es"'),
  
  // Trip-specific validations
  body('destinations')
    .if(body('eventType').equals('trip'))
    .isArray({ min: 1 })
    .withMessage('Trip events require at least one destination'),
  
  body('destinations.*.name')
    .if(body('eventType').equals('trip'))
    .trim()
    .notEmpty()
    .withMessage('Destination name is required'),
  
  body('destinations.*.arrivalDate')
    .if(body('eventType').equals('trip'))
    .notEmpty()
    .withMessage('Arrival date is required')
    .isISO8601()
    .withMessage('Invalid arrival date format'),
  
  body('destinations.*.departureDate')
    .if(body('eventType').equals('trip'))
    .notEmpty()
    .withMessage('Departure date is required')
    .isISO8601()
    .withMessage('Invalid departure date format'),
  
  body('destinations.*.accommodation')
    .if(body('eventType').equals('trip'))
    .trim()
    .notEmpty()
    .withMessage('Accommodation is required'),
  
  // Business meeting validations
  body('dresscode')
    .if(body('eventType').equals('bizmeet'))
    .trim()
    .notEmpty()
    .withMessage('Dress code is required for business meetings'),
  
  body('agenda')
    .if(body('eventType').equals('bizmeet'))
    .trim()
    .notEmpty()
    .withMessage('Agenda is required for business meetings'),
  
  // Protest validations
  body('manifesto')
    .if(body('eventType').equals('protest'))
    .trim()
    .notEmpty()
    .withMessage('Manifesto is required for protests'),
]; 