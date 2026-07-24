import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const sanitizeUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  throwIfMissing({ name, email, password, role });

  if (role !== 'student' && role !== 'teacher') {
    throw new ApiError(400, 'Invalid role. Must be student or teacher.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'User already exists');

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ message: 'User registered successfully', token, user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  throwIfMissing({ email, password });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(200).json({ message: 'Login successful', token, user: sanitizeUser(user) });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { studentProfile: true, teacherProfile: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  const { password: _pw, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword });
});

export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  throwIfMissing({ token });

  // NOTE: removed unused OAuth2Client instantiation. Google token verification
  // uses the userinfo endpoint directly (the pre-existing approach).
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new ApiError(400, 'Invalid Google token');

  const payload = await response.json();
  if (!payload?.email) throw new ApiError(400, 'Invalid Google payload');

  const { email, name, sub: googleId, picture: avatar } = payload;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    user = await prisma.user.create({
      data: { name: name || 'Google User', email, password: hashedPassword, role: 'unassigned', provider: 'google', googleId, avatar },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { email },
      data: { googleId, provider: 'google', avatar: user.avatar || avatar },
    });
  }

  const jwtToken = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(200).json({ message: 'Google login successful', token: jwtToken, user: sanitizeUser(user) });
});

export const updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const { role } = req.body;
  if (role !== 'student' && role !== 'teacher') throw new ApiError(400, 'Invalid role. Must be student or teacher.');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== 'unassigned') throw new ApiError(400, 'Role is already assigned');

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      role,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
  });

  const jwtToken = generateToken({ id: updated.id, email: updated.email, role: updated.role });
  res.status(200).json({ message: 'Role updated successfully', token: jwtToken, user: sanitizeUser(updated) });
});
