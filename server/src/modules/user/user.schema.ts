import { z } from 'zod';
import { registry} from '../../config/swagger.js';


// full profile (returned for /me and /users/:id )
const userProfileSchema = z.object({
  id: z.string().openapi({ example: "clx1abc23def45" }),
  email: z.string().openapi({ example: "alice@example.com" }),
  username: z.string().openapi({ example: "alice" }),
  displayName: z.string().openapi({ example: "Alice" }),
  avatarUrl: z.string().nullable().openapi({ example: null }),
  bio: z.string().nullable().openapi({ example: "Hey there!" }),
  createdAt: z.string().openapi({ example: '2026-04-01T00:00:00.000Z' }),
})
  .openapi('UserProfile');

// for search result
const userSearchResultSchema = z
  .object({
    id: z.string().openapi({ example: 'clx1abc23def45' }),
    username: z.string().openapi({ example: 'alice' }),
    displayName: z.string().openapi({ example: 'Alice' }),
    avatarUrl: z.string().nullable().openapi({ example: null }),
  })
  .openapi('UserSearchResult');

function apiEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Success' }),
    data: dataSchema,
  });
}

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional().openapi({ example: 'Alice W.' }),
  bio: z.string().max(200).trim().optional().openapi({ example: 'Software dev & coffee addict' }),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).trim().openapi({ example: 'ali' }),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1).openapi({ example: 'clx1abc23def456' }),
});

registry.registerPath({
  method: 'get',
  path: '/api/users/me',
  tags: ['Users'],
  summary: 'Get own profile',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: {
        'application/json': {
          schema: apiEnvelope(z.object({ user: userProfileSchema })),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/users/me',
  tags: ['Users'],
  summary: 'Update own profile',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: updateProfileSchema }},
    },
  },
  responses: {
    200: {
      description: 'Updated profile',
      content: {
        'application/json': {
          schema: apiEnvelope(z.object({ user: userProfileSchema })),
        },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/users/me/avatar',
  tags: ['Users'],
  summary: 'Upload avatar image',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            avatar: z.string().openapi({ format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Avatar updated',
      content: {
        'application/json': {
          schema: apiEnvelope(z.object({ user: userProfileSchema })),
        },
      },
    },
    400: { description: 'No file or invalid file type' },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/search",
  tags: ["Users"],
  summary: "Search users by username or display name",
  security: [{ cookieAuth: [] }],
  request: {
    query: searchQuerySchema,
  },
  responses: {
    200: {
      description: "Matching users",
      content: {
        "application/json": {
          schema: apiEnvelope(
            z.object({ users: z.array(userSearchResultSchema) }),
          ),
        },
      },
    },
    400: { description: "Missing or invalid query" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  tags: ["Users"],
  summary: "Get a user by ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamSchema,
  },
  responses: {
    200: {
      description: "User profile",
      content: {
        "application/json": {
          schema: apiEnvelope(z.object({ user: userProfileSchema })),
        },
      },
    },
    401: { description: "Unauthorized" },
    404: { description: "User not found" },
  },
});
