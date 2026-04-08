import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/apiError.js';

interface ValidationSchemas {
      body?: z.ZodType;
      query?: z.ZodType;
      params?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
      return (req: Request, _res: Response, next: NextFunction) => {
            try {
                  if (schemas.body) {
                        req.body = schemas.body.parse(req.body);
                  }
                  if (schemas.query) {
                        req.query = schemas.query.parse(req.query) as typeof req.query;
                  }
                  if (schemas.params) {
                        req.params = schemas.params.parse(req.params) as typeof req.params;
                  }
                  next();
            } catch (error) {
                  if (error instanceof z.ZodError) {
                        const message = error.issues
                              .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
                              .join(', ');
                        next(ApiError.badRequest(message));
                  } else {
                        next(error);
                  }
            }
      };
}