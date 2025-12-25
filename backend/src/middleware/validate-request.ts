import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error: any) {
      const firstError = error?.errors?.[0]?.message || 'Validation failed';
      return sendError(res, 400, firstError);
    }
  };
};
