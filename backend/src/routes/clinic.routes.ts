import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createClinic, updateClinic, getMyClinics } from '../controllers/clinic.controller';

const router = Router();

router.get('/my', authenticate, authorize('doctor'), getMyClinics);

router.post(
  '/',
  authenticate,
  authorize('doctor'),
  [
    body('name').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('timings').optional().isArray(),
  ],
  validate,
  createClinic
);

router.patch('/:id', authenticate, authorize('doctor', 'admin', 'super_admin'), updateClinic);

export default router;
