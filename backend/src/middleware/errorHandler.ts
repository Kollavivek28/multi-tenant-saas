import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, 404, 'Route not found');
};

export const errorHandler = (err: Error & { statusCode?: number }, req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, status, message);
};
