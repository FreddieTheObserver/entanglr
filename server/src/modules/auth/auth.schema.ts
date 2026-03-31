import { z } from 'zod';
import { registry } from '../../config/swagger.js';

registry.registerComponent('securitySchemes', 'bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
});

export const registerInputSchema = z.object({
      email: z.string().email().openapi({ example: 'alice@example.com' }),
      username: z.string().min(3).max(20).openapi({ example: 'alice' }),
      displayName: z.string().min(1).max(50).openapi({ example: 'Alice' }),
      password: z.string().min(8).openapi({ example: 'password123' }),
});

export const loginInputSchema = z.object({
      email: z.string().openapi({ example: 'alice@example.com' }),
      password: z.string().min(1).openapi({ example: 'password123' }),
});

export const userResponseSchema = z
      .object({
            id: z.string().openapi({ example: 'clx1abc23def456' }),
            email: z.string().openapi({ example: 'alice@example.com' }),
            username: z.string().openapi({ example: 'alice' }),
            displayName: z.string().openapi({ example: 'Alice' }),
            avatarUrl: z.string().nullable().openapi({ example: null }),
            createdAt: z.string().openapi({ example: '2026-03-30T00:00:00.000Z'}),
      })
      .openapi('User');

registry.registerPath({
      method: 'post',
      path: '/api/auth/register',
      tags: ['Auth'],
      summary: 'Register a new user',
      request: {
            body: {
                  content: { 'application/json': { schema: registerInputSchema } },
            },
      },
      responses: {
            201: {
                  description: 'Registerd successfully. Cookie is set.',
                  content: {
                        'application/json': {
                              schema: z.object({ user: userResponseSchema }),
                        },
                  },
            },
            400: { description: 'Validation error' },
            409: { description: 'Email or username already taken' },
      }
});

registry.registerPath({
      method: 'post',
      path: '/api/auth/login',
      tags: ['Auth'],
      summary: 'Login with email and password',
      request: {
            body: {
                  content: { 'application/json': { schema: loginInputSchema } },
            },
      },
      responses: {
            200: {
                  description: 'Login successful. Cookie is set.',
                  content: {
                        'application/json': {
                              schema: z.object({ user: userResponseSchema }),
                        },
                  },
            },
            400: { description: 'Validation error' },
            401: { description: 'Invalid credentials' },
      },
});

registry.registerPath({
      method: 'post',
      path: '/api/auth/logout',
      tags: ['Auth'],
      summary: 'Logout and clear auth cookie',
      responses: {
            200: { description: 'Logged out successfully' },
      },
});

registry.registerPath({
      method: 'get',
      path: '/api/auth/me',
      tags: ['Auth'],
      summary: 'Get the current authenticated user',
      security: [{ bearerAuth: [] }],
      responses: {
            200: {
                  description: 'Current user',
                  content: {
                        "application/json": {
                              schema: z.object({ user: userResponseSchema }),
                        },
                  },
            },
            401: { description: 'Unauthorized' },
      },
});