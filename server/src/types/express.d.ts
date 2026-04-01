declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        username: string;
        displayName: string;
        passwordHash: string;
        avatarUrl: string | null;
        bio: string | null;
        lastSeenAt: Date;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export {};

