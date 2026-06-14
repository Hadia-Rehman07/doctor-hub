import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
} from '../controllers/appointment.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('patient'),
  [
    body('doctor_id').isUUID(),
    body('scheduled_at').isISO8601(),
    body('reason').optional().isString().isLength({ max: 500 }),
    body('clinic_id').optional().isUUID(),
  ],
  validate,
  bookAppointment
);

router.get('/my', authenticate, authorize('patient'), getMyAppointments);

router.get('/doctor', authenticate, authorize('doctor'), getDoctorAppointments);

router.patch('/:id/cancel', authenticate, cancelAppointment);

export default router;
