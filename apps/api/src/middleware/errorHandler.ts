import { NextFunction, Request, Response } from 'express';
import { logger } from '@mhp-gpc/core';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({ error }, 'API error encountered');
  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.status(500).json({ message: 'Unknown error' });
};
