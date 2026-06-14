import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadPaymentScreenshot,
  getPendingPayments,
  verifyPayment,
  getPaymentByAppointment,
} from '../controllers/payment.controller';

const router = Router();

// Store files in memory for Supabase Storage upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.post(
  '/:appointment_id/screenshot',
  authenticate,
  authorize('patient'),
  upload.single('screenshot'),
  uploadPaymentScreenshot
);

router.get(
  '/pending',
  authenticate,
  authorize('assistant', 'admin', 'super_admin'),
  getPendingPayments
);

router.patch(
  '/:id/verify',
  authenticate,
  authorize('assistant', 'admin', 'super_admin'),
  [
    body('action').isIn(['approve', 'reject']),
    body('rejection_note').optional().isString(),
  ],
  validate,
  verifyPayment
);

router.get(
  '/appointment/:appointment_id',
  authenticate,
  getPaymentByAppointment
);

export default router;
