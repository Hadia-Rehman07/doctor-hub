import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// ─── List All Users ───────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, parseInt(limit as string));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);

  const { data, error, count } = await query;

  if (error) { res.status(500).json({ success: false, message: error.message }); return; }
  res.json({ success: true, total: count, page: pageNum, limit: limitNum, users: data });
};

// ─── Toggle User Active Status ────────────────────────────────────────────────
export const toggleUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_active } = req.body;

  const { data, error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', id)
    .select('id, email, is_active')
    .single();

  if (error || !data) { res.status(404).json({ success: false, message: 'User not found' }); return; }
  res.json({ success: true, user: data });
};

// ─── Create Privileged User (admin creates assistant/admin) ───────────────────
export const createPrivilegedUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, phone, role, doctor_id } = req.body;

  const allowedRoles = ['admin', 'assistant'];
  // Only super_admin can create admin accounts
  if (role === 'admin' && req.user!.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Only super_admin can create admin accounts' });
    return;
  }

  if (!allowedRoles.includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role for this endpoint' });
    return;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, full_name, phone, role })
    .select('id, email, full_name, role')
    .single();

  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ success: false, message: error.message });
    return;
  }

  if (role === 'assistant' && doctor_id) {
    await supabase.from('assistants').insert({ user_id: user.id, doctor_id });
  }

  res.status(201).json({ success: true, user });
};

// ─── Verify Doctor ────────────────────────────────────────────────────────────
export const verifyDoctor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_verified } = req.body;

  const { data, error } = await supabase
    .from('doctors')
    .update({ is_verified })
    .eq('id', id)
    .select('id, is_verified, users!inner(full_name, email)')
    .single();

  if (error || !data) { res.status(404).json({ success: false, message: 'Doctor not found' }); return; }
  res.json({ success: true, doctor: data });
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const [users, doctors, appointments, payments] = await Promise.all([
    supabase.from('users').select('role', { count: 'exact', head: true }),
    supabase.from('doctors').select('is_verified', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('appointments').select('status', { count: 'exact', head: true }),
    supabase.from('payments').select('status', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  res.json({
    success: true,
    stats: {
      total_users: users.count,
      verified_doctors: doctors.count,
      total_appointments: appointments.count,
      pending_payments: payments.count,
    },
  });
};
