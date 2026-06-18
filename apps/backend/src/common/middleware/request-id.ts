import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

type RequestWithId = Request & { id?: string };

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
