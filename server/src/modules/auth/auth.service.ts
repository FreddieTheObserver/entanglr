import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { ApiError } from '../../lib/apiError.js';
import type { z } from 'zod';
import type { registerInputSchema, loginInputSchema } from './auth.schema.js';

type RegisterInput = z.infer<typeof registerInputSchema>;
type LoginInput = z.infer<typeof loginInputSchema>;

export function toSafeUser(user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      createdAt: Date;
      [key: string]: unknown;
}) {
      return {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
      };
}

export async function register(input: RegisterInput) {
      const existing = await prisma.user.findFirst({
            where: {
                  OR: [{ email: input.email }, { username: input.username }],
            },
      });

      if (existing) {
            if (existing.email === input.email) {
                  throw ApiError.conflict('Email already in use');
            }
            throw ApiError.conflict('Username already taken');
      }

      const passwordHash = await hashPassword(input.password);

      const user = await prisma.user.create({
            data: {
                  email: input.email,
                  username: input.username,
                  displayName: input.displayName,
                  passwordHash,
            },
      });

      const token = signToken({ userId: user.id });

      return { token, user: toSafeUser(user) };
}

export async function login(input: LoginInput) {
      const user = await prisma.user.findUnique({
            where: { email: input.email },
      });

      if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
      }

      const isValid = await comparePassword(input.password, user.passwordHash);

      if (!isValid) {
            throw ApiError.unauthorized('Invalid email or password');
      }

      const token = signToken({ userId: user.id });

      return { token, user: toSafeUser(user) };
}