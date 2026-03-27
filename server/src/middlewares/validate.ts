import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../lib/apiError.js';

interface ValidationSchemas {
      body?: AnyZodObject;
      query?: AnyZodObject;
      params?: AnyZodObject;
}

export function validate(schemas: ValidationSchemas) {
      return (req: Request, _res: Response, next: NextFunction) => {
            try {
                  if (schemas.body) {
                        req.body = schemas.body.parse(req.body);
                  }
                  if (schemas.query) {
                        req.query = schemas.query.parse(req.query);
                  }
                  if (schemas.params) {
                        req.params = schemas.params.parse(req.params);
                  }
                  next();
            } catch (error) {
                  if (error instanceof ZodError) {
                        const message = error.errors
                              .map((e) => `${e.path.join('.')}: ${e.message}`)
                              .join(', ');
                        next(ApiError.badRequest(message));
                  } else {
                        next(error);
                  }
            }
      };
}