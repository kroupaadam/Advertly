import express from 'express';
import { register, login, me, verifyPhone, resendVerificationCode, changePassword, completeOnboarding, getOnboardingStatus, updateAvatar } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-phone', verifyPhone);
router.post('/resend-code', resendVerificationCode);
router.get('/me', verifyToken, me);
router.post('/change-password', verifyToken, changePassword);
router.post('/complete-onboarding', verifyToken, completeOnboarding);
router.get('/onboarding-status', verifyToken, getOnboardingStatus);
router.post('/update-avatar', verifyToken, updateAvatar);

export default router;
