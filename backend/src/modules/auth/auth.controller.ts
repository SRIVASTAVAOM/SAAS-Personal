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

      if (error.message === 'SCHOOL_SUSPENDED') {
        res.status(403).json({
          success: false,
          error: 'Your school access is currently suspended. Please contact platform administration.',
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

  static async forgotRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = String(req.query.identifier || req.body.identifier || '').trim();
      if (!identifier) {
        res.status(400).json({ success: false, error: 'Identifier is required' });
        return;
      }
      const data = await AuthService.getForgotRequirements(identifier);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'No account found with this identifier' });
        return;
      }
      if (error.message === 'ACCOUNT_INACTIVE') {
        res.status(403).json({ success: false, error: 'This account is inactive. Please contact school administration.' });
        return;
      }
      next(error);
    }
  }

  static async verifyForgotChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, phone, dob, email } = req.body;
      if (!identifier) {
        res.status(400).json({ success: false, error: 'Identifier is required' });
        return;
      }

      const result = await AuthService.verifyForgotChallenge(identifier, { phone, dob, email });
      res.status(200).json({
        success: true,
        message: 'Identity verified successfully',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'No account found with this identifier' });
        return;
      }
      if (error.message === 'ACCOUNT_INACTIVE') {
        res.status(403).json({ success: false, error: 'This account is inactive. Please contact school administration.' });
        return;
      }
      if (error.message === 'VERIFICATION_FAILED') {
        res.status(401).json({
          success: false,
          error: 'Verification details do not match school records. Please check registered details or contact admin.',
        });
        return;
      }
      next(error);
    }
  }

  static async resetPasswordWithToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        res.status(400).json({ success: false, error: 'Reset token and new password are required' });
        return;
      }

      const result = await AuthService.resetPasswordWithToken(resetToken, newPassword);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.message === 'PASSWORD_TOO_SHORT') {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
        return;
      }
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN' || error.message === 'INVALID_TOKEN_PURPOSE') {
        res.status(401).json({ success: false, error: 'Reset link/token is invalid or has expired. Please verify identity again.' });
        return;
      }
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Current password and new password are required' });
        return;
      }

      const result = await AuthService.changePassword(req.user.userId, currentPassword, newPassword);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        res.status(400).json({ success: false, error: 'Current password does not match' });
        return;
      }
      if (error.message === 'PASSWORD_TOO_SHORT') {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
        return;
      }
      next(error);
    }
  }
}

