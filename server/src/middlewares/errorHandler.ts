import { ErrorRequestHandler } from 'express';
import { ApiErorr } from '../lib/apiError.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      if (err instanceof ApiErorr) {
            res.status(err.statusCode).json({
                  success: false,
                  message: err.message;
            });
            return;
      }

      console.error('Unexpected error: ', err);
      res.status(500).json({
            success: false,
            message:
                  env.NODE_ENV === 'development' ? (err as Error).message : 'Internal server error',
      });
}