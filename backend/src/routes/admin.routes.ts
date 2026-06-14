import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  listUsers,
  toggleUser,
  createPrivilegedUser,
  verifyDoctor,
  getDashboardStats,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin/super_admin role
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/stats', getDashboardStats);

router.get(
  '/users',
  [
    query('role').optional().isIn(['super_admin', 'admin', 'doctor', 'patient', 'assistant']),
    query('page').optional().isInt({ min: 1 }),
  ],
  validate,
  listUsers
);

router.patch(
  '/users/:id/toggle',
  [body('is_active').isBoolean()],
  validate,
  toggleUser
);

router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').trim().notEmpty(),
    body('role').isIn(['admin', 'assistant']),
    body('doctor_id').optional().isUUID(),
  ],
  validate,
  createPrivilegedUser
);

router.patch(
  '/doctors/:id/verify',
  [body('is_verified').isBoolean()],
  validate,
  verifyDoctor
);

export default router;
