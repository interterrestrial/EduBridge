import { Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';
import { buildSchedulePrompt } from '../prompts/schedule.prompt';
import { AuthRequest } from '../middleware/authenticate';
import { resolveStudentId } from '../middleware/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, throwIfMissing } from '../utils/apiError';

const llmService = new LlmService();

export const generateSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const { examDate, subjects = ['Computer Science'], dailyHours = 2 } = req.body;
  throwIfMissing({ examDate });

  const notes = await prisma.note.findMany({ where: { studentId } });
  const attempts = await prisma.quizAttempt.findMany({ where: { studentId } });
  const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]')))) as string[];

  const prompt = buildSchedulePrompt({
    examDate,
    subjects,
    dailyHours: Number(dailyHours),
    noteTitles: notes.map((n) => n.title),
    weakTopics,
  });

  const rawOutput = await llmService.generate(prompt);
  const cleaned = rawOutput.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  let scheduleBlocks: any[];
  try {
    scheduleBlocks = JSON.parse(cleaned);
  } catch {
    scheduleBlocks = [
      { day: 'Day 1', date: 'Today', title: 'Review Core Concepts & Weak Topics', focusTopic: weakTopics[0] || 'Fundamentals', actionType: 'read_note', durationMinutes: 45 },
      { day: 'Day 1', date: 'Today', title: 'Practice Quiz & Knowledge Check', focusTopic: 'Assessment', actionType: 'take_quiz', durationMinutes: 20 },
    ];
  }

  const schedule = await prisma.studySchedule.create({
    data: { studentId, examDate, subject: subjects.join(', '), dailyHours: Number(dailyHours), scheduleJson: JSON.stringify(scheduleBlocks) },
  });

  res.status(201).json({ id: schedule.id, examDate: schedule.examDate, subject: schedule.subject, dailyHours: schedule.dailyHours, blocks: scheduleBlocks });
});

export const getTodayAgenda = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const pushAssignments = await prisma.teacherPushAssignment.findMany({
    where: { studentId, status: 'pending' },
    include: { note: true, quiz: true },
  });

  const teacherTasks = pushAssignments.map((p) => ({
    id: p.id,
    title: `Teacher Assignment: ${p.title}`,
    focusTopic: p.note?.title || p.quiz?.title || 'Assignment',
    actionType: p.noteId ? 'read_note' : 'take_quiz',
    noteId: p.noteId,
    quizId: p.quizId,
    isTeacherPush: true,
  }));

  res.status(200).json({ agenda: teacherTasks });
});

export const getStudentSchedules = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = resolveStudentId(req);
  const schedules = await prisma.studySchedule.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  const formatted = schedules.map((s) => ({
    id: s.id,
    examDate: s.examDate,
    subject: s.subject,
    dailyHours: s.dailyHours,
    blocks: JSON.parse(s.scheduleJson || '[]'),
    createdAt: s.createdAt,
  }));
  res.status(200).json({ schedules: formatted });
});
