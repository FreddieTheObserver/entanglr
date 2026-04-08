import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../lib/apiError.js";
import { SAFE_USER_SELECT } from "../modules/auth/auth.service.js";

export async function authenticate(
      req: Request,
      _res: Response,
      next: NextFunction,
) {
      const token: string | undefined = req.cookies?.token;

      if (!token) {
            return next(ApiError.unauthorized('Authentication required'));
      }

      try {
            const { userId, tokenVersion } = verifyToken(token);
            const user = await prisma.user.findUnique({
                  where: { id: userId },
                  select: { ...SAFE_USER_SELECT, tokenVersion: true },
            });

            if (!user) {
                  return next(ApiError.unauthorized('User not found'));
            }

            if (user.tokenVersion !== tokenVersion) {
                  return next(ApiError.unauthorized('Token revoked'));
            }

            req.user = user;
            next();
      } catch {
            next(ApiError.unauthorized('Invalid or expired token'));
      }
}