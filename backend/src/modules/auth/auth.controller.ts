import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../types/auth.types';

const loginSchema = z
  .object({
    identifier: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.identifier || data.username), {
    message: 'Identifier (Email, Phone or ID) is required',
    path: ['identifier'],
  });

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const identifier = (validation.data.identifier || validation.data.username)!;
      const { password } = validation.data;
      const result = await AuthService.login(identifier, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please verify your identifier and password.',
        });
        return;
      }

      if (error.message === 'ACCOUNT_INACTIVE') {
        res.status(403).json({
          success: false,
          error: 'Your account is currently inactive. Please contact administration.',
        });
        return;
      }

      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const profile = await AuthService.getCurrentUser(req.user.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}
