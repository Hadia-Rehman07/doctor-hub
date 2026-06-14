import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { UserRole } from '../types';

const SALT_ROUNDS = 12;

const signToken = (userId: string, role: UserRole, email: string): string =>
  jwt.sign(
    { userId, role, email },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
  );

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, phone, role = 'patient' } = req.body;

  // Only admin/super_admin can create privileged accounts
  const allowedPublicRoles: UserRole[] = ['patient', 'doctor'];
  if (!allowedPublicRoles.includes(role)) {
    res.status(403).json({ success: false, message: 'Cannot self-register with that role' });
    return;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, full_name, phone, role })
    .select('id, email, full_name, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ success: false, message: 'Email already registered' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
    return;
  }

  // Create role-specific profile row
  if (role === 'patient') {
    await supabase.from('patients').insert({ user_id: user.id });
  } else if (role === 'doctor') {
    const { specialization, treatment_type, consultation_fee } = req.body;
    await supabase.from('doctors').insert({
      user_id: user.id,
      specialization: specialization ?? 'General',
      treatment_type: treatment_type ?? 'allopathic',
      consultation_fee: consultation_fee ?? 0,
    });
  }

  const token = signToken(user.id, role, user.email);
  res.status(201).json({ success: true, token, user });
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, password_hash, is_active')
    .eq('email', email)
    .single();

  if (error || !user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ success: false, message: 'Account is deactivated' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = signToken(user.id, user.role, user.email);
  const { password_hash: _, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at')
    .eq('id', req.user!.userId)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, user: data });
};

// ─── Forgot Password (token-based reset flow) ─────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  // Always return 200 to prevent user enumeration
  if (!user) {
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  // In production: generate a time-limited reset token, store it, and email the user.
  // Here we return a signed JWT valid for 15 minutes as a demonstration.
  const resetToken = jwt.sign(
    { userId: user.id, purpose: 'reset' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' as any }
  );

  res.json({
    success: true,
    message: 'Password reset token generated.',
    reset_token: resetToken, // In prod: send via email, never expose in response
  });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { reset_token, new_password } = req.body;

  let payload: any;
  try {
    payload = jwt.verify(reset_token, process.env.JWT_SECRET!);
  } catch {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    return;
  }

  if (payload.purpose !== 'reset') {
    res.status(400).json({ success: false, message: 'Invalid token purpose' });
    return;
  }

  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  const { error } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', payload.userId);

  if (error) {
    res.status(500).json({ success: false, message: 'Could not update password' });
    return;
  }

  res.json({ success: true, message: 'Password updated successfully' });
};
