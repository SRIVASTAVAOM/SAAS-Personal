import { Request } from 'express';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ACCOUNTANT' | 'COORDINATOR' | 'MANAGEMENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface TokenPayload {
  userId: string;
  schoolId: string;
  identifier: string;
  email: string | null;
  roles: UserRole[];
  profileId: string | null;
  wingId: string | null;
  classId: string | null;
  sectionId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
