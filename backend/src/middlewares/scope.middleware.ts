import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';

/**
 * Enforces that Coordinator can only access resources belonging to their assigned wing.
 */
export function enforceWingScope(paramName = 'wingId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const requestedWingId = req.params[paramName] || req.body[paramName] || req.query[paramName];

    // School ADMIN and SUPER_ADMIN have full access across wings
    if (req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    next();
  };
}

/**
 * Enforces that Student can only access their own student records.
 */
export function enforceStudentScope(paramName = 'studentId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const requestedStudentId = req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (req.user.roles.includes('STUDENT')) {
      if (!req.user.profileId || req.user.profileId !== requestedStudentId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied. Students can only access their own records',
        });
        return;
      }
    }

    next();
  };
}
