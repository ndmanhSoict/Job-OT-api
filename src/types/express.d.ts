import { UserRole } from '@shared/constants/enums';

declare global {
  namespace Express {
    interface Request {
      /** Populated by authenticateJWT middleware after token verification */
      user?: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
      };
      /** Request ID for tracing */
      requestId?: string;
    }
  }
}

export {};