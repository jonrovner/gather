import { Request, Response } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: Function) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Transform the errors into a more user-friendly format
    const formattedErrors = errors.array().reduce((acc: { [key: string]: string }, error: ValidationError) => {
      const field = error.type === 'field' ? error.path : error.type;
      // If the field already has an error, don't override it
      if (!acc[field]) {
        acc[field] = error.msg;
      }
      return acc;
    }, {});

    return res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
}; 