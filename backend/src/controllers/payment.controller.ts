import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// ─── Upload Payment Screenshot (Step 4) ──────────────────────────────────────
export const uploadPaymentScreenshot = async (req: Request, res: Response): Promise<void> => {
  const { appointment_id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, message: 'Payment screenshot is required' });
    return;
  }

  // Verify appointment belongs to patient
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('appointment_id', appointment_id)
    .eq('patient_id', patient?.id)
    .single();

  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment record not found' });
    return;
  }

  if (payment.status !== 'pending') {
    res.status(400).json({ success: false, message: 'Payment already processed' });
    return;
  }

  // Upload file to Supabase Storage
  const fileName = `${appointment_id}-${Date.now()}.${file.mimetype.split('/')[1]}`;
  const { data: upload, error: uploadError } = await supabase.storage
    .from(process.env.STORAGE_BUCKET ?? 'payment-screenshots')
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (uploadError) {
    res.status(500).json({ success: false, message: 'File upload failed: ' + uploadError.message });
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(process.env.STORAGE_BUCKET ?? 'payment-screenshots')
    .getPublicUrl(fileName);

  // Update payment and appointment status
  await supabase.from('payments').update({ screenshot_url: publicUrl, status: 'pending' }).eq('id', payment.id);
  await supabase.from('appointments').update({ status: 'payment_uploaded' }).eq('id', appointment_id);

  res.json({
    success: true,
    message: 'Screenshot uploaded. Awaiting assistant verification.',
    screenshot_url: publicUrl,
  });
};

// ─── Get Pending Payments for Assistant (Step 5) ─────────────────────────────
export const getPendingPayments = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `*, appointments!inner(scheduled_at, reason, status,
        doctors!inner(users!inner(full_name), specialization),
        patients!inner(users!inner(full_name, phone)))`
    )
    .eq('status', 'pending')
    .not('screenshot_url', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, payments: data });
};

// ─── Verify Payment (Step 5 – assistant action) ───────────────────────────────
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, rejection_note } = req.body; // action: 'approve' | 'reject'

  const { data: payment } = await supabase
    .from('payments')
    .select('id, appointment_id, status')
    .eq('id', id)
    .single();

  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment not found' });
    return;
  }

  if (payment.status !== 'pending') {
    res.status(400).json({ success: false, message: 'Payment already processed' });
    return;
  }

  if (action === 'approve') {
    await supabase.from('payments').update({
      status: 'verified',
      verified_by: req.user!.userId,
      verified_at: new Date().toISOString(),
    }).eq('id', id);

    // Step 6 – confirm appointment
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', payment.appointment_id);

    res.json({ success: true, message: 'Payment verified. Appointment confirmed.' });
  } else if (action === 'reject') {
    await supabase.from('payments').update({
      status: 'rejected',
      verified_by: req.user!.userId,
      rejection_note: rejection_note ?? 'Payment rejected by assistant',
    }).eq('id', id);

    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', payment.appointment_id);

    res.json({ success: true, message: 'Payment rejected. Appointment cancelled.' });
  } else {
    res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'" });
  }
};

// ─── Get Payment by Appointment ───────────────────────────────────────────────
export const getPaymentByAppointment = async (req: Request, res: Response): Promise<void> => {
  const { appointment_id } = req.params;

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('appointment_id', appointment_id)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, message: 'Payment not found' });
    return;
  }

  res.json({ success: true, payment: data });
};
