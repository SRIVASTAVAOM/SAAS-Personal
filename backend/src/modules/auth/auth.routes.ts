import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.me);

// Method 2: Verification Challenge Forgot Password Flow
router.get('/forgot-password/requirements', AuthController.forgotRequirements);
router.post('/forgot-password/requirements', AuthController.forgotRequirements);
router.post('/forgot-password/verify', AuthController.verifyForgotChallenge);
router.post('/forgot-password/reset', AuthController.resetPasswordWithToken);

// Inside-App: Authenticated User Change Password
router.post('/change-password', authenticateToken, AuthController.changePassword);

export default router;

