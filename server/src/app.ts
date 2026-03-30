import express from 'express';
import cors from 'cors';
import helment from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { createSwaggerRouter } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
      const app = express();

      app.use(helment());
      app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
      app.use(morgan('dev'));
      app.use(express.json());

      app.get('/api/health', (_req, res) => {
            res.json({ success: true, message: 'Server is running' });
      });

      app.use('/api-docs', createSwaggerRouter());
      app.use(errorHandler);

      return app;
}