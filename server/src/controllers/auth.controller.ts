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
  studentCode: user.studentCode,
  studentProfile: user.studentProfile,
  teacherProfile: user.teacherProfile,
  teachersMapped: user.teachersMapped,
});

const generateStudentCode = async (): Promise<string> => {
  while (true) {
    const code = 'EB-' + Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.user.findUnique({ where: { studentCode: code } });
    if (!existing) return code;
  }
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  throwIfMissing({ name, email, password, role });

  if (role !== 'student' && role !== 'teacher') {
    throw new ApiError(400, 'Invalid role. Must be student or teacher.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'User already exists');

  const hashedPassword = await hashPassword(password);
  const studentCode = role === 'student' ? await generateStudentCode() : undefined;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      studentCode,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({ message: 'User registered successfully', token, user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  throwIfMissing({ email, password });

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });
  if (!user || !user.password) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  if (user.role === 'student' && !user.studentCode) {
    const code = await generateStudentCode();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { studentCode: code },
      include: {
        studentProfile: true,
        teacherProfile: true,
        teachersMapped: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true, teacherProfile: true },
            },
          },
        },
      },
    });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.status(200).json({ message: 'Login successful', token, user: sanitizeUser(user) });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  let user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });
  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === 'student' && !user.studentCode) {
    const code = await generateStudentCode();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { studentCode: code },
      include: {
        studentProfile: true,
        teacherProfile: true,
        teachersMapped: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true, teacherProfile: true },
            },
          },
        },
      },
    });
  }

  const { password: _pw, ...userWithoutPassword } = user;
  res.status(200).json({ user: userWithoutPassword });
});

export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  throwIfMissing({ token });

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new ApiError(400, 'Invalid Google token');

  const payload = await response.json();
  if (!payload?.email) throw new ApiError(400, 'Invalid Google payload');

  const { email, name, sub: googleId, picture: avatar } = payload;

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });
  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    user = await prisma.user.create({
      data: { name: name || 'Google User', email, password: hashedPassword, role: 'unassigned', provider: 'google', googleId, avatar },
      include: {
        studentProfile: true,
        teacherProfile: true,
        teachersMapped: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true, teacherProfile: true },
            },
          },
        },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { email },
      data: { googleId, provider: 'google', avatar: user.avatar || avatar },
      include: {
        studentProfile: true,
        teacherProfile: true,
        teachersMapped: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true, teacherProfile: true },
            },
          },
        },
      },
    });
  }

  if (user.role === 'student' && !user.studentCode) {
    const code = await generateStudentCode();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { studentCode: code },
      include: {
        studentProfile: true,
        teacherProfile: true,
        teachersMapped: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true, teacherProfile: true },
            },
          },
        },
      },
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

  const studentCode = role === 'student' ? await generateStudentCode() : undefined;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      role,
      studentCode,
      studentProfile: role === 'student' ? { create: {} } : undefined,
      teacherProfile: role === 'teacher' ? { create: {} } : undefined,
    },
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });

  const jwtToken = generateToken({ id: updated.id, email: updated.email, role: updated.role });
  res.status(200).json({ message: 'Role updated successfully', token: jwtToken, user: sanitizeUser(updated) });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const { name, institution, course, semester, learningPreference, organization, department, subject, specialization } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, 'User not found');

  const updateData: any = {};
  if (name !== undefined) updateData.name = String(name).trim();

  if (user.role === 'student') {
    const studentData: any = {};
    if (institution !== undefined) studentData.institution = institution ? String(institution).trim() : null;
    if (course !== undefined) studentData.course = course ? String(course).trim() : null;
    if (semester !== undefined) studentData.semester = semester ? String(semester).trim() : null;
    if (learningPreference !== undefined) studentData.learningPreference = learningPreference ? String(learningPreference).trim() : null;

    updateData.studentProfile = {
      upsert: {
        create: studentData,
        update: studentData,
      },
    };
  } else if (user.role === 'teacher') {
    const teacherData: any = {};
    if (organization !== undefined) teacherData.organization = organization ? String(organization).trim() : null;
    if (department !== undefined) teacherData.department = department ? String(department).trim() : null;
    if (subject !== undefined) teacherData.subject = subject ? String(subject).trim() : null;
    if (specialization !== undefined) teacherData.specialization = specialization ? String(specialization).trim() : null;

    updateData.teacherProfile = {
      upsert: {
        create: teacherData,
        update: teacherData,
      },
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    include: {
      studentProfile: true,
      teacherProfile: true,
      teachersMapped: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true, teacherProfile: true },
          },
        },
      },
    },
  });

  res.status(200).json({ message: 'Profile updated successfully', user: sanitizeUser(updated) });
});
