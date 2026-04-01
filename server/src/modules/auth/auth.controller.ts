import type { Request, Response, NextFunction } from "express";
import * as authService from './auth.service.js';
import { successResponse, createdResponse } from "../../lib/apiResponse.js";
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
};

export async function registerController(
      req: Request,
      res: Response,
      next: NextFunction,
) {
      try {
            const { token, user } = await authService.register(req.body);
            res.cookie('token', token, COOKIE_OPTIONS);
            createdResponse(res, { user });
      } catch (error) {
            next(error);
      }
}

export async function loginController(
      req: Request, 
      res: Response,
      next: NextFunction,
) {
      try {
            const { token, user } = await authService.login(req.body);
            res.cookie('token', token, COOKIE_OPTIONS);
            successResponse(res, { user });
      } catch (error) {
            next(error);
      }
}

export async function logoutController(
      _req: Request,
      res: Response,
      next: NextFunction,
) {
      try {
            res.clearCookie('token', { path: '/' });
            successResponse(res, null, 'Logged out successfully');
      } catch (error) {
            next(error);
      }
}

export async function getMeController(
      req: Request,
      res: Response,
      next: NextFunction,
) {
      try {
            successResponse(res, { user: authService.toSafeUser(req.user) });
      } catch (error) {
            next(error);
      }
}