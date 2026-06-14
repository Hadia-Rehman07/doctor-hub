import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// ─── Get Patient Medical History ──────────────────────────────────────────────
export const getMyHistory = async (req: Request, res: Response): Promise<void> => {
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!patient) {
    res.status(404).json({ success: false, message: 'Patient profile not found' });
    return;
  }

  const { data, error } = await supabase
    .from('medical_history')
    .select(`*, doctors!inner(specialization, treatment_type, users!inner(full_name)), prescriptions(*)`)
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, history: data });
};

// ─── Get History for a Specific Patient (Doctor/Admin) ───────────────────────
export const getPatientHistory = async (req: Request, res: Response): Promise<void> => {
  const { patient_id } = req.params;

  const { data, error } = await supabase
    .from('medical_history')
    .select(`*, doctors!inner(specialization, treatment_type, users!inner(full_name)), prescriptions(*)`)
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, history: data });
};

// ─── Add Medical History Record (Doctor only – APPEND ONLY) ──────────────────
export const addHistoryRecord = async (req: Request, res: Response): Promise<void> => {
  const { patient_id, appt_id, diagnosis, notes, report_urls } = req.body;

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return;
  }

  // Verify patient exists
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .single();

  if (!patient) {
    res.status(404).json({ success: false, message: 'Patient not found' });
    return;
  }

  const { data, error } = await supabase
    .from('medical_history')
    .insert({ patient_id, doctor_id: doctor.id, appt_id, diagnosis, notes, report_urls: report_urls ?? [] })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.status(201).json({ success: true, message: 'Medical record added.', record: data });
};

// ─── Add Prescription (Doctor only – IMMUTABLE once created) ─────────────────
export const addPrescription = async (req: Request, res: Response): Promise<void> => {
  const { history_id, medicines, instructions } = req.body;

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return;
  }

  // Verify history record belongs to this doctor
  const { data: history } = await supabase
    .from('medical_history')
    .select('id, patient_id, doctor_id')
    .eq('id', history_id)
    .single();

  if (!history) {
    res.status(404).json({ success: false, message: 'Medical history record not found' });
    return;
  }

  if (history.doctor_id !== doctor.id) {
    res.status(403).json({ success: false, message: 'You can only add prescriptions to your own records' });
    return;
  }

  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      history_id,
      doctor_id: doctor.id,
      patient_id: history.patient_id,
      medicines,
      instructions,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.status(201).json({
    success: true,
    message: 'Prescription added. This record is now immutable.',
    prescription: data,
  });
};

// ─── Get Single Prescription ──────────────────────────────────────────────────
export const getPrescription = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('prescriptions')
    .select(`*, doctors!inner(users!inner(full_name), specialization), patients!inner(users!inner(full_name))`)
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, message: 'Prescription not found' });
    return;
  }

  res.json({ success: true, prescription: data });
};
