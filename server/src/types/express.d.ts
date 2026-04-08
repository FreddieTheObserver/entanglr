import type { SafeUser } from '../modules/auth/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user: SafeUser;
    }
  }
}

export {};

