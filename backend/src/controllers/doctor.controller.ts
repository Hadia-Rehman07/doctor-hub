import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// ─── Search / Filter Doctors ──────────────────────────────────────────────────
export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  const { treatment_type, disease, city, specialization, page = '1', limit = '10' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabase
    .from('doctors')
    .select(
      `id, specialization, treatment_type, diseases_treated, bio,
       experience_years, consultation_fee, is_verified,
       users!inner(full_name, email, phone),
       clinics(id, name, city, address, timings)`,
      { count: 'exact' }
    )
    .eq('is_verified', true)
    .range(from, to);

  if (treatment_type) query = query.eq('treatment_type', treatment_type);
  if (specialization) query = query.ilike('specialization', `%${specialization}%`);
  if (disease) query = query.contains('diseases_treated', [disease]);
  if (city) query = query.eq('clinics.city', city);

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({
    success: true,
    total: count,
    page: pageNum,
    limit: limitNum,
    doctors: data,
  });
};

// ─── Get Single Doctor ────────────────────────────────────────────────────────
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('doctors')
    .select(
      `*, users!inner(full_name, email, phone),
       clinics(*), assistants(id, users!inner(full_name))`
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, message: 'Doctor not found' });
    return;
  }

  res.json({ success: true, doctor: data });
};

// ─── Update Doctor Profile ────────────────────────────────────────────────────
export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { specialization, treatment_type, diseases_treated, bio, experience_years, consultation_fee } = req.body;

  // Ensure doctor owns this profile
  const { data: existing } = await supabase
    .from('doctors')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    res.status(404).json({ success: false, message: 'Doctor not found' });
    return;
  }

  const isOwner = existing.user_id === req.user!.userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

  if (!isOwner && !isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  const { data, error } = await supabase
    .from('doctors')
    .update({ specialization, treatment_type, diseases_treated, bio, experience_years, consultation_fee })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  res.json({ success: true, doctor: data });
};
