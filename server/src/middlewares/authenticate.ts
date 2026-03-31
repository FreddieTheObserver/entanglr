import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../lib/apiError.js";

export async function authenticate(
      req: Request,
      _res: Response,
      next: NextFunction,
) {
      const token = 
            req.cookies?.token ?? extractBearerToken(req.headers.authorization);
      
      if (!token) {
            return next(ApiError.unauthorized('Authentication required'));
      }

      try {
            const { userId } = verifyToken(token);
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                  return next(ApiError.unauthorized('User not found'));
            }

            req.user = user;
            next();
      } catch {
            next(ApiError.unauthorized('Invalid or expired token'));
      }
}

function extractBearerToken(
      authHeader: string | undefined,
): string | undefined {
      if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
      }
}