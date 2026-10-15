import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/auth.types';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.roles) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication context missing',
      });
      return;
    }

    const hasPermission = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Insufficient role permissions. Required one of: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
