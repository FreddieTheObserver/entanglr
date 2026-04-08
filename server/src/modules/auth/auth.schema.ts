import { z } from 'zod';
import { registry } from '../../config/swagger.js';

registry.registerComponent('securitySchemes', 'cookieAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
});

export const registerInputSchema = z.object({
      email: z.string().email().trim().toLowerCase().openapi({ example: 'alice@example.com' }),
      username: z.string().min(3).max(20).trim().openapi({ example: 'alice' }),
      displayName: z.string().min(1).max(50).trim().openapi({ example: 'Alice' }),
      password: z.string().min(8).openapi({ example: 'password123' }),
});

export const loginInputSchema = z.object({
      email: z.string().email().trim().toLowerCase().openapi({ example: 'alice@example.com' }),
      password: z.string().min(1).openapi({ example: 'password123' }),
});

export const userResponseSchema = z
      .object({
            id: z.string().openapi({ example: 'clx1abc23def456' }),
            email: z.string().openapi({ example: 'alice@example.com' }),
            username: z.string().openapi({ example: 'alice' }),
            displayName: z.string().openapi({ example: 'Alice' }),
            avatarUrl: z.string().nullable().openapi({ example: null }),
            createdAt: z.string().openapi({ example: '2026-03-30T00:00:00.000Z' }),
      })
      .openapi('User');

/** Wraps a data schema in the standard { success, message, data } envelope */
function apiEnvelope<T extends z.ZodType>(dataSchema: T) {
      return z.object({
            success: z.boolean().openapi({ example: true }),
            message: z.string().openapi({ example: 'Success' }),
            data: dataSchema,
      });
}

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
                  description: 'Registered successfully. Cookie is set.',
                  content: {
                        'application/json': {
                              schema: apiEnvelope(z.object({ user: userResponseSchema })),
                        },
                  },
            },
            400: { description: 'Validation error' },
            409: { description: 'Registration failed' },
      },
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
                              schema: apiEnvelope(z.object({ user: userResponseSchema })),
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
      security: [{ cookieAuth: [] }],
      responses: {
            200: {
                  description: 'Logged out successfully',
                  content: {
                        'application/json': {
                              schema: apiEnvelope(z.null()),
                        },
                  },
            },
            401: { description: 'Unauthorized' },
      },
});

registry.registerPath({
      method: 'get',
      path: '/api/auth/me',
      tags: ['Auth'],
      summary: 'Get the current authenticated user',
      security: [{ cookieAuth: [] }],
      responses: {
            200: {
                  description: 'Current user',
                  content: {
                        'application/json': {
                              schema: apiEnvelope(z.object({ user: userResponseSchema })),
                        },
                  },
            },
            401: { description: 'Unauthorized' },
      },
});