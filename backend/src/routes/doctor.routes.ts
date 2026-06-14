import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { getDoctors, getDoctorById, updateDoctor } from '../controllers/doctor.controller';

const router = Router();

router.get(
  '/',
  [
    query('treatment_type').optional().isIn(['allopathic', 'homeopathic', 'herbal']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  getDoctors
);

router.get('/:id', getDoctorById);

router.patch(
  '/:id',
  authenticate,
  authorize('doctor', 'admin', 'super_admin'),
  [
    body('treatment_type').optional().isIn(['allopathic', 'homeopathic', 'herbal']),
    body('consultation_fee').optional().isFloat({ min: 0 }),
    body('experience_years').optional().isInt({ min: 0 }),
  ],
  validate,
  updateDoctor
);

export default router;
