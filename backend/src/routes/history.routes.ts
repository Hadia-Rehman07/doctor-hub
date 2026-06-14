import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMyHistory,
  getPatientHistory,
  addHistoryRecord,
  addPrescription,
  getPrescription,
} from '../controllers/history.controller';

const router = Router();

// Patient views own history
router.get('/my', authenticate, authorize('patient'), getMyHistory);

// Doctor / admin views a specific patient's history
router.get(
  '/patient/:patient_id',
  authenticate,
  authorize('doctor', 'admin', 'super_admin'),
  getPatientHistory
);

// Doctor adds a new (immutable) history record
router.post(
  '/',
  authenticate,
  authorize('doctor'),
  [
    body('patient_id').isUUID(),
    body('diagnosis').trim().notEmpty(),
    body('appt_id').optional().isUUID(),
    body('notes').optional().isString(),
    body('report_urls').optional().isArray(),
  ],
  validate,
  addHistoryRecord
);

// Doctor adds a prescription to an existing history record
router.post(
  '/prescriptions',
  authenticate,
  authorize('doctor'),
  [
    body('history_id').isUUID(),
    body('medicines').isArray({ min: 1 }),
    body('medicines.*.name').trim().notEmpty(),
    body('medicines.*.dosage').trim().notEmpty(),
    body('medicines.*.frequency').trim().notEmpty(),
    body('medicines.*.duration').trim().notEmpty(),
    body('instructions').optional().isString(),
  ],
  validate,
  addPrescription
);

// Anyone authenticated can fetch a prescription by ID
router.get('/prescriptions/:id', authenticate, getPrescription);

export default router;
