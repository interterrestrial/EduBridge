import { Request, Response } from 'express';
import prisma from '../prisma';

export const getClassroomHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: {
        quizAttempts: true,
        attendance: true,
        studentProfile: true,
      },
    });

    const topicAccuracyMap: Record<string, { correctSum: number; totalSum: number }> = {};
    const studentRoster = [];

    for (const student of students) {
      const attempts = student.quizAttempts;
      const totalQuizzes = attempts.length;
      const accuracies = attempts.map((a) => a.accuracy);
      const avgAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

      // Collect attendance %
      const attendanceRecords = student.attendance;
      const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
      const attendancePct = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 100;

      // Extract weak topics
      const weakTopics = Array.from(new Set(attempts.flatMap((a) => JSON.parse(a.weakTopicsJson || '[]'))));

      studentRoster.push({
        id: student.id,
        name: student.name,
        email: student.email,
        masteryScore: avgAccuracy,
        quizzesTaken: totalQuizzes,
        attendancePct,
        status: avgAccuracy >= 80 ? 'Excelling' : avgAccuracy >= 60 ? 'On Track' : 'Needs Support',
        weakTopics,
      });

      // Accumulate topic accuracy heatmap data
      attempts.forEach((attempt) => {
        const weakList: string[] = JSON.parse(attempt.weakTopicsJson || '[]');
        weakList.forEach((topic) => {
          if (!topicAccuracyMap[topic]) {
            topicAccuracyMap[topic] = { correctSum: 0, totalSum: 0 };
          }
          topicAccuracyMap[topic].totalSum += 10;
          topicAccuracyMap[topic].correctSum += Math.round((attempt.accuracy / 100) * 10);
        });
      });
    }

    // Build class weak topics heatmap list
    const heatmap = Object.entries(topicAccuracyMap).map(([topic, stat]) => {
      const avgAcc = stat.totalSum > 0 ? Math.round((stat.correctSum / stat.totalSum) * 100) : 50;
      return {
        topic,
        averageAccuracy: avgAcc,
        severity: avgAcc < 50 ? 'high' : avgAcc < 70 ? 'medium' : 'low',
      };
    });

    res.status(200).json({
      summary: {
        totalStudents: students.length,
        averageClassMastery: Math.round(
          studentRoster.reduce((acc, s) => acc + s.masteryScore, 0) / (students.length || 1)
        ),
        averageAttendance: Math.round(
          studentRoster.reduce((acc, s) => acc + s.attendancePct, 0) / (students.length || 1)
        ),
      },
      heatmap,
      studentRoster,
    });
  } catch (error: any) {
    console.error('Error fetching classroom heatmap:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch classroom heatmap' });
  }
};

export const pushMaterialToStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId = 'teacher_1', studentId, title, noteId, quizId, dueDate } = req.body;

    if (!studentId || !title) {
      res.status(400).json({ error: 'studentId and title are required' });
      return;
    }

    const assignment = await prisma.teacherPushAssignment.create({
      data: {
        teacherId,
        studentId,
        title,
        noteId: noteId || null,
        quizId: quizId || null,
        dueDate: dueDate || 'End of Week',
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Assignment pushed directly to student agenda!',
      assignment,
    });
  } catch (error: any) {
    console.error('Error pushing material:', error);
    res.status(500).json({ error: error.message || 'Failed to push assignment to student' });
  }
};
