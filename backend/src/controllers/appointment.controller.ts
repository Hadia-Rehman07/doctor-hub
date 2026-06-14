import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// ─── Book Appointment (Step 1-3 of workflow) ──────────────────────────────────
export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  const { doctor_id, clinic_id, scheduled_at, reason } = req.body;

  // Resolve patient profile from logged-in user
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!patient) {
    res.status(404).json({ success: false, message: 'Patient profile not found' });
    return;
  }

  // Validate doctor exists & is verified
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, consultation_fee, is_verified')
    .eq('id', doctor_id)
    .single();

  if (!doctor || !doctor.is_verified) {
    res.status(404).json({ success: false, message: 'Doctor not found or not verified' });
    return;
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({ patient_id: patient.id, doctor_id, clinic_id, scheduled_at, reason, status: 'pending' })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  // Auto-create a pending payment record
  await supabase.from('payments').insert({
    appointment_id: appointment.id,
    patient_id: patient.id,
    amount: doctor.consultation_fee,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Appointment booked. Please upload payment screenshot to proceed.',
    appointment,
    fee: doctor.consultation_fee,
  });
};

// ─── Get Patient's Appointments ───────────────────────────────────────────────
export const getMyAppointments = async (req: Request, res: Response): Promise<void> => {
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
    .from('appointments')
    .select(`*, doctors(specialization, treatment_type, users!inner(full_name)), payments(status, amount)`)
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, appointments: data });
};

// ─── Get Doctor's Appointments ────────────────────────────────────────────────
export const getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return;
  }

  const { status } = req.query;

  let query = supabase
    .from('appointments')
    .select(`*, patients(date_of_birth, gender, users!inner(full_name, phone)), payments(status, amount)`)
    .eq('doctor_id', doctor.id)
    .order('scheduled_at', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, appointments: data });
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────
export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status, patients!inner(user_id)')
    .eq('id', id)
    .single();

  if (!appt) {
    res.status(404).json({ success: false, message: 'Appointment not found' });
    return;
  }

  const isOwner = (appt.patients as any).user_id === req.user!.userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

  if (!isOwner && !isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  if (['completed', 'cancelled'].includes(appt.status)) {
    res.status(400).json({ success: false, message: `Cannot cancel a ${appt.status} appointment` });
    return;
  }

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
  res.json({ success: true, message: 'Appointment cancelled' });
};
