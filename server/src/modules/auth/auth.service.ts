import { Prisma } from '../../generated/prisma/index.js';
import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { ApiError } from '../../lib/apiError.js';
import type { z } from 'zod';
import type { registerInputSchema, loginInputSchema } from './auth.schema.js';

type RegisterInput = z.infer<typeof registerInputSchema>;
type LoginInput = z.infer<typeof loginInputSchema>;

/** Fields safe to expose in API responses and req.user */
export const SAFE_USER_SELECT = {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
} as const;

export type SafeUser = {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      createdAt: Date;
};

export async function register(input: RegisterInput) {
      const existing = await prisma.user.findFirst({
            where: {
                  OR: [{ email: input.email }, { username: input.username }],
            },
      });

      if (existing) {
            throw ApiError.conflict('Registration failed');
      }

      const passwordHash = await hashPassword(input.password);

      let created: SafeUser & { tokenVersion: number };
      try {
            created = await prisma.user.create({
                  data: {
                        email: input.email,
                        username: input.username,
                        displayName: input.displayName,
                        passwordHash,
                  },
                  select: { ...SAFE_USER_SELECT, tokenVersion: true },
            });
      } catch (error) {
            if (
                  error instanceof Prisma.PrismaClientKnownRequestError &&
                  error.code === 'P2002'
            ) {
                  throw ApiError.conflict('Registration failed');
            }
            throw error;
      }

      const token = signToken({
            userId: created.id,
            tokenVersion: created.tokenVersion,
      });

      const { tokenVersion: _, ...user } = created;
      return { token, user };
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

      const token = signToken({
            userId: user.id,
            tokenVersion: user.tokenVersion,
      });

      const { passwordHash: _, tokenVersion: __, ...safeUser } = user;

      return { token, user: safeUser };
}

export async function bumpTokenVersion(userId: string) {
      await prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
      });
}