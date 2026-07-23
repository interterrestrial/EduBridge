import { Request, Response } from 'express';
import prisma from '../prisma';
import { LlmService } from '../services/llm.service';

const llmService = new LlmService();

export const generateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, examDate, subjects = ['Computer Science'], dailyHours = 2 } = req.body;

    if (!studentId || !examDate) {
      res.status(400).json({ error: 'studentId and examDate are required' });
      return;
    }

    // Fetch student's notes & weak topics for personalization
    const notes = await prisma.note.findMany({ where: { studentId } });
    const attempts = await prisma.quizAttempt.findMany({ where: { studentId } });
    const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

    const prompt = `You are EduBridge AI Schedule Planner.
Generate an optimized, daily study timetable leading up to an upcoming exam.

Student Details:
- Exam Date: ${examDate}
- Subjects: ${subjects.join(', ')}
- Daily Available Study Hours: ${dailyHours} hours
- Available Uploaded Notes: ${notes.map((n) => n.title).join(', ') || 'General Notes'}
- Identified Weak Topics Needing Revision: ${weakTopics.join(', ') || 'Fundamentals'}

INSTRUCTIONS:
Return a JSON array of daily study blocks for the next 7 days. Each block must have:
- day: e.g. "Day 1", "Day 2"
- date: e.g. "Tomorrow"
- title: clear study block title
- focusTopic: specific concept/topic
- linkedNoteTitle: title of note to read (if available)
- actionType: "read_note" | "take_quiz" | "review_flashcards"
- durationMinutes: estimated duration in minutes

Output ONLY valid JSON array with no markdown formatting.`;

    const rawOutput = await llmService.generate(prompt);
    const cleaned = rawOutput.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    let scheduleBlocks = [];

    try {
      scheduleBlocks = JSON.parse(cleaned);
    } catch {
      scheduleBlocks = [
        {
          day: 'Day 1',
          date: 'Today',
          title: 'Review Core Concepts & Weak Topics',
          focusTopic: weakTopics[0] || 'Fundamentals',
          actionType: 'read_note',
          durationMinutes: 45,
        },
        {
          day: 'Day 1',
          date: 'Today',
          title: 'Practice Quiz & Knowledge Check',
          focusTopic: 'Assessment',
          actionType: 'take_quiz',
          durationMinutes: 20,
        },
      ];
    }

    const schedule = await prisma.studySchedule.create({
      data: {
        studentId,
        examDate,
        subject: subjects.join(', '),
        dailyHours: Number(dailyHours),
        scheduleJson: JSON.stringify(scheduleBlocks),
      },
    });

    res.status(201).json({
      id: schedule.id,
      examDate: schedule.examDate,
      subject: schedule.subject,
      dailyHours: schedule.dailyHours,
      blocks: scheduleBlocks,
    });
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study schedule' });
  }
};

export const getTodayAgenda = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;

    const latestSchedule = await prisma.studySchedule.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    const pushAssignments = await prisma.teacherPushAssignment.findMany({
      where: { studentId, status: 'pending' },
      include: { note: true, quiz: true },
    });

    let blocks = [];
    if (latestSchedule) {
      const allBlocks = JSON.parse(latestSchedule.scheduleJson || '[]');
      blocks = allBlocks.slice(0, 2); // Get today's top 2 blocks
    } else {
      blocks = [
        {
          day: 'Today',
          date: 'Today',
          title: 'RAG Study Session',
          focusTopic: 'Review Uploaded Notes',
          actionType: 'read_note',
          durationMinutes: 30,
        },
        {
          day: 'Today',
          date: 'Today',
          title: 'Active Recall Check',
          focusTopic: 'Weak Topic Quiz',
          actionType: 'take_quiz',
          durationMinutes: 15,
        },
      ];
    }

    const teacherTasks = pushAssignments.map((p) => ({
      id: p.id,
      title: `Teacher Assignment: ${p.title}`,
      focusTopic: p.note?.title || p.quiz?.title || 'Assignment',
      actionType: p.noteId ? 'read_note' : 'take_quiz',
      noteId: p.noteId,
      quizId: p.quizId,
      isTeacherPush: true,
    }));

    res.status(200).json({
      agenda: [...teacherTasks, ...blocks],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch today agenda' });
  }
};

export const getStudentSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const schedules = await prisma.studySchedule.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = schedules.map((s) => ({
      id: s.id,
      examDate: s.examDate,
      subject: s.subject,
      dailyHours: s.dailyHours,
      blocks: JSON.parse(s.scheduleJson || '[]'),
      createdAt: s.createdAt,
    }));

    res.status(200).json({ schedules: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch schedules' });
  }
};
