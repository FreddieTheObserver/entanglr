import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';

import { z } from 'zod';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function createSwaggerRouter(): Router {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const document = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Entanglr API',
      version: '1.0.0',
      description: 'Live chat application API',
    },
  });

  const router = Router();
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(document));

  return router;
}