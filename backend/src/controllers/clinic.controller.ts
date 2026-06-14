import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const createClinic = async (req: Request, res: Response): Promise<void> => {
  const { name, address, city, timings } = req.body;

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', req.user!.userId)
    .single();

  if (!doctor) { res.status(404).json({ success: false, message: 'Doctor profile not found' }); return; }

  const { data, error } = await supabase
    .from('clinics')
    .insert({ doctor_id: doctor.id, name, address, city, timings: timings ?? [] })
    .select()
    .single();

  if (error) { res.status(500).json({ success: false, message: error.message }); return; }
  res.status(201).json({ success: true, clinic: data });
};

export const updateClinic = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user!.userId).single();
  const { data: clinic } = await supabase.from('clinics').select('doctor_id').eq('id', id).single();

  if (!clinic) { res.status(404).json({ success: false, message: 'Clinic not found' }); return; }
  if (clinic.doctor_id !== doctor?.id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }

  const { data, error } = await supabase.from('clinics').update(req.body).eq('id', id).select().single();
  if (error) { res.status(500).json({ success: false, message: error.message }); return; }
  res.json({ success: true, clinic: data });
};

export const getMyClinics = async (req: Request, res: Response): Promise<void> => {
  const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', req.user!.userId).single();
  if (!doctor) { res.status(404).json({ success: false, message: 'Doctor profile not found' }); return; }

  const { data, error } = await supabase.from('clinics').select('*').eq('doctor_id', doctor.id);
  if (error) { res.status(500).json({ success: false, message: error.message }); return; }
  res.json({ success: true, clinics: data });
};
