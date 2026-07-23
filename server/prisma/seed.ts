import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.upsert({
    where: { id: 'student_1' },
    update: {},
    create: {
      id: 'student_1',
      name: 'Test Student',
      email: 'student@edubridge.test',
      role: 'student',
      studentProfile: {
        create: {
          institution: 'Test University',
          course: 'Computer Science',
          totalStudyHours: 24,
        },
      },
    },
  });

  const teacher = await prisma.user.upsert({
    where: { id: 'teacher_1' },
    update: {},
    create: {
      id: 'teacher_1',
      name: 'Professor Smith',
      email: 'teacher@edubridge.test',
      role: 'teacher',
      teacherProfile: {
        create: {
          organization: 'Test University',
          department: 'Computer Science',
        },
      },
    },
  });

  // Seed sample Attendance
  await prisma.attendanceRecord.createMany({
    data: [
      { studentId: 'student_1', subject: 'Data Structures & Algorithms', status: 'present', date: '2026-07-20' },
      { studentId: 'student_1', subject: 'Data Structures & Algorithms', status: 'present', date: '2026-07-21' },
      { studentId: 'student_1', subject: 'Database Management Systems', status: 'present', date: '2026-07-22' },
      { studentId: 'student_1', subject: 'Operating Systems', status: 'absent', date: '2026-07-23' },
    ],
  });

  console.log('✅ Seed successful! Created student, teacher, and attendance records.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
