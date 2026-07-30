import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';

const prisma = new PrismaClient();

// --- Synthetic data pools (generated, not hardcoded IDs) ---

const FIRST_NAMES = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Ishaan', 'Saanvi', 'Reyansh', 'Riya', 'Kabir', 'Myra', 'Vivaan', 'Anika', 'Aditya', 'Navya'];
const LAST_NAMES = ['Patel', 'Reddy', 'Nair', 'Gupta', 'Singh', 'Khan', 'Shah', 'Verma', 'Joshi', 'Malhotra', 'Chopra', 'Bose'];
const SUBJECTS = ['Data Preprocessing & Analytics', 'Design & Analysis of Algorithms', 'Database Systems & Indexing'];
const TOPICS = {
  'Data Preprocessing & Analytics': ['Binning', 'Outliers', 'IQR Method', 'Data Cleaning', 'Normalization', 'Missing Values'],
  'Design & Analysis of Algorithms': ['Big-O Notation', 'Master Theorem', 'Recurrence Relations', 'Divide & Conquer', 'Dynamic Programming', 'Greedy Algorithms'],
  'Database Systems & Indexing': ['B+ Trees', 'Normalization', 'ACID Properties', 'Indexing', 'Transactions', 'Joins'],
};

// Deterministic pseudo-random so the seed is reproducible
let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

async function main() {
  console.log('🌱 Seeding EduBridge demo data...');

  // Idempotency: delete prior demo users (cascade removes their folders/notes/quizzes/etc.)
  await prisma.user.deleteMany({ where: { id: { in: ['student_1', 'teacher_1'] } } });
  // Also clean up any synthetic students from prior runs (matched by email domain)
  await prisma.user.deleteMany({ where: { email: { contains: '@demo.edubridge.edu' } } });

  const studentPassword = await hashPassword('demo1234');
  const teacherPassword = await hashPassword('demo1234');

  // --- 1. Primary demo student (Yash) ---
  const student = await prisma.user.create({
    data: {
      id: 'student_1',
      name: 'Yash Sharma',
      email: 'student@edubridge.edu',
      password: studentPassword,
      role: 'student',
      studentCode: 'EB-100001',
      studentProfile: { create: { institution: 'Tech Institute of Engineering', course: 'Computer Science & Data Analytics', semester: '6', totalStudyHours: 42 } },
    },
  });

  // --- 2. Demo teacher ---
  const teacher = await prisma.user.create({
    data: {
      id: 'teacher_1',
      name: 'Prof. Verma',
      email: 'teacher@edubridge.edu',
      password: teacherPassword,
      role: 'teacher',
      teacherProfile: { create: { organization: 'Tech Institute', department: 'Computer Science', subject: 'Design & Analysis of Algorithms', specialization: 'Algorithms', experience: 12 } },
    },
  });
  const teacherSubject = 'Design & Analysis of Algorithms';

  // --- 3. Sample classroom roster (so the teacher dashboard has visible data) ---
  // 6 synthetic students enrolled in the demo teacher's classroom, each with
  // notes, quizzes, attempts, attendance, and varied quiz/exam scores so the
  // blended mastery + practice-vs-exam gap indicators populate immediately.
  const sampleStudentDefs = [
    {
      name: 'Aarav Patel',
      email: 'aarav.patel@demo.edubridge.edu',
      className: '6th',
      section: 'A',
      attendancePct: 92,
      avgQuizAccuracy: 88,
      avgExamPct: 84, // exam strong — performs as well as practice suggests
      weakTopics: ['Master Theorem', 'Greedy Algorithms'],
    },
    {
      name: 'Diya Reddy',
      email: 'diya.reddy@demo.edubridge.edu',
      className: '6th',
      section: 'A',
      attendancePct: 85,
      avgQuizAccuracy: 78,
      avgExamPct: 80, // aligned
      weakTopics: ['B+ Trees', 'Indexing'],
    },
    {
      name: 'Vihaan Nair',
      email: 'vihaan.nair@demo.edubridge.edu',
      className: '6th',
      section: 'B',
      attendancePct: 70,
      avgQuizAccuracy: 82,
      avgExamPct: 45, // SURFACE PRACTICE — gap > 20, the headline gap indicator
      weakTopics: ['Binning', 'IQR Method', 'Normalization'],
    },
    {
      name: 'Ananya Gupta',
      email: 'ananya.gupta@demo.edubridge.edu',
      className: '6th',
      section: 'B',
      attendancePct: 95,
      avgQuizAccuracy: 72,
      avgExamPct: 70, // aligned
      weakTopics: ['Recurrence Relations'],
    },
    {
      name: 'Arjun Singh',
      email: 'arjun.singh@demo.edubridge.edu',
      className: '7th',
      section: 'A',
      attendancePct: 60,
      avgQuizAccuracy: 55,
      avgExamPct: 48, // low across the board — needs support
      weakTopics: ['ACID Properties', 'Transactions', 'Joins'],
    },
    {
      name: 'Ishaan Khan',
      email: 'ishaan.khan@demo.edubridge.edu',
      className: '7th',
      section: 'A',
      attendancePct: 80,
      avgQuizAccuracy: 65,
      avgExamPct: 72, // exam strong
      weakTopics: ['Divide & Conquer'],
    },
  ];

  console.log('   Generating sample classroom roster...');
  // Enroll the primary student too so the teacher's roster shows Yash + 6 sample
  await prisma.teacherStudent.create({
    data: {
      teacherId: teacher.id,
      studentId: student.id,
      subject: teacherSubject,
      className: '6th',
      section: 'A',
    },
  });

  const sampleStudentIds: string[] = [];
  for (const def of sampleStudentDefs) {
    const sampleStudent = await prisma.user.create({
      data: {
        name: def.name,
        email: def.email,
        password: studentPassword,
        role: 'student',
        studentCode: `EB-${randInt(100000, 999999)}`,
        studentProfile: {
          create: {
            institution: 'Tech Institute of Engineering',
            course: 'Computer Science & Data Analytics',
            semester: '6',
            totalStudyHours: randInt(20, 80),
          },
        },
      },
    });

    // Enroll the sample student in the demo teacher's classroom for their (className, section)
    await prisma.teacherStudent.create({
      data: {
        teacherId: teacher.id,
        studentId: sampleStudent.id,
        subject: teacherSubject,
        className: def.className,
        section: def.section,
      },
    });
    sampleStudentIds.push(sampleStudent.id);

    // Two quizzes per student with weak topics reflecting their weakTopics array
    const quizTitles = [
      `${def.name.split(' ')[0]}'s ${def.weakTopics[0]} Practice Quiz`,
      `${def.name.split(' ')[0]}'s Mixed Topics Quiz`,
    ];
    for (let qi = 0; qi < quizTitles.length; qi++) {
      const quiz = await prisma.quiz.create({
        data: {
          title: quizTitles[qi],
          difficulty: qi === 0 ? 'medium' : 'hard',
          questionsJson: JSON.stringify([
            { question: `Sample Q1 about ${def.weakTopics[0]}`, optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctAnswer: 'B', explanation: 'Sample', topic: def.weakTopics[0] || 'General' },
            { question: `Sample Q2 about ${def.weakTopics[1] || 'General'}`, optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctAnswer: 'C', explanation: 'Sample', topic: def.weakTopics[1] || 'General' },
          ]),
          studentId: sampleStudent.id,
        },
      });
      await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId: sampleStudent.id,
          score: Math.round((def.avgQuizAccuracy / 100) * 2),
          totalQuestions: 2,
          accuracy: def.avgQuizAccuracy,
          weakTopicsJson: JSON.stringify(def.weakTopics),
        },
      });
    }

    // Attendance records — generate ~10 days, with status matching attendancePct
    const today = new Date();
    for (let d = 0; d < 10; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const isPresent = rand() * 100 < def.attendancePct;
      await prisma.attendanceRecord.create({
        data: {
          studentId: sampleStudent.id,
          subject: teacherSubject,
          status: isPresent ? 'present' : 'absent',
          date: date.toISOString().slice(0, 10),
        },
      });
    }
  }

  // --- 4. Yash's folders, notes, flashcards (same as before) ---
  const folderDataPrep = await prisma.noteFolder.create({
    data: { name: 'Data Preprocessing & Analytics', color: '#6366f1', studentId: student.id },
  });
  const folderAlgo = await prisma.noteFolder.create({
    data: { name: 'Design & Analysis of Algorithms', color: '#ec4899', studentId: student.id },
  });
  const folderDB = await prisma.noteFolder.create({
    data: { name: 'Database Systems & Indexing', color: '#10b981', studentId: student.id },
  });

  const notes = await Promise.all([
    prisma.note.create({ data: { title: 'Equal-Width & Equal-Frequency Binning', filePath: 'uploads/binning_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id } }),
    prisma.note.create({ data: { title: 'Outlier Detection & IQR Method', filePath: 'uploads/outlier_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id } }),
    prisma.note.create({ data: { title: 'Asymptotic Complexity & Recurrence Relations', filePath: 'uploads/master_theorem_notes.txt', fileType: '.txt', folderId: folderAlgo.id, studentId: student.id } }),
    prisma.note.create({ data: { title: 'B+ Tree Indexing & Storage Engines', filePath: 'uploads/bplus_tree_notes.txt', fileType: '.txt', folderId: folderDB.id, studentId: student.id } }),
  ]);

  const deck1 = await prisma.flashcardFolder.create({ data: { name: 'Data Preprocessing Deck', topic: 'Binning', studentId: student.id, noteId: notes[0].id } });
  const deck2 = await prisma.flashcardFolder.create({ data: { name: 'Algorithms Deck', topic: 'Complexity', studentId: student.id, noteId: notes[2].id } });
  const deck3 = await prisma.flashcardFolder.create({ data: { name: 'Database Deck', topic: 'Indexing', studentId: student.id, noteId: notes[3].id } });

  await prisma.flashcard.createMany({
    data: [
      { question: 'What is equal-width binning?', answer: 'Dividing the value range into k intervals of equal width.', topic: 'Binning', type: 'definition', folderId: deck1.id, noteId: notes[0].id, studentId: student.id },
      { question: 'Define equal-frequency binning.', answer: 'Each bin contains the same number of data points (quantiles).', topic: 'Binning', type: 'concept', folderId: deck1.id, noteId: notes[0].id, studentId: student.id },
      { question: 'Formula for IQR.', answer: 'IQR = Q3 - Q1', topic: 'Outliers', type: 'formula', folderId: deck1.id, noteId: notes[1].id, studentId: student.id },
      { question: 'What is the Master Theorem?', answer: 'A method for solving recurrences of the form T(n)=aT(n/b)+f(n).', topic: 'Complexity', type: 'definition', folderId: deck2.id, noteId: notes[2].id, studentId: student.id },
      { question: 'B+ tree vs B-tree?', answer: 'B+ tree stores data only in leaves; internal nodes are index-only.', topic: 'Indexing', type: 'comparison', folderId: deck3.id, noteId: notes[3].id, studentId: student.id },
    ],
  });

  // --- 4. Yash's quiz + attempt (so heatmap has at least one data point) ---
  const yashQuiz = await prisma.quiz.create({
    data: { title: 'Binning & Outliers Quiz', difficulty: 'medium', questionsJson: JSON.stringify([{ question: 'What is IQR?', optionA: 'Q1-Q3', optionB: 'Q3-Q1', optionC: 'Mean+Median', optionD: 'Max-Min', correctAnswer: 'B', explanation: 'IQR = Q3 - Q1', topic: 'Outliers' }]), noteId: notes[1].id, studentId: student.id },
  });
  await prisma.quizAttempt.create({
    data: { quizId: yashQuiz.id, studentId: student.id, score: 1, totalQuestions: 1, accuracy: 100, weakTopicsJson: JSON.stringify([]) },
  });

  // --- 5. Exams & Exam Scores (one per scope + one school-wide) ---
  const EXAMS = [
    { title: '6A Midterm', subject: 'Mathematics', maxMarks: 100, examDate: '2026-07-15', className: '6th', section: 'A' },
    { title: '6B Midterm', subject: 'Mathematics', maxMarks: 100, examDate: '2026-07-15', className: '6th', section: 'B' },
    { title: '7A Midterm', subject: 'Mathematics', maxMarks: 100, examDate: '2026-07-22', className: '7th', section: 'A' },
    { title: 'School-wide Annual Exam', subject: 'Mathematics', maxMarks: 100, examDate: '2026-08-01', className: null, section: null },
  ];

  console.log('   Generating exams and scores...');
  // Pull every student account (covers primary, sample, and any manually added)
  // so the exam scores reflect the full classroom.
  const allStudents = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true, email: true },
  });

  // Build a lookup so the sample students get their tier-specific exam percentage
  // (drives the headline practice-vs-exam gap on the dashboard)
  const examPctByEmail: Record<string, number> = Object.fromEntries(
    sampleStudentDefs.map((d) => [d.email, d.avgExamPct]),
  );
  // Primary student gets a low exam score vs their 100% quiz accuracy so they
  // also surface the headline "Surface Practice" gap story.
  examPctByEmail['student@edubridge.edu'] = 35;

  for (const examData of EXAMS) {
    const exam = await prisma.exam.create({
      data: {
        title: examData.title,
        subject: examData.subject,
        maxMarks: examData.maxMarks,
        examDate: examData.examDate,
        className: examData.className,
        section: examData.section,
        teacherId: teacher.id,
      },
    });

    // Only give exam scores to students enrolled in the exam's scope
    // (skip if exam is class/section-scoped and student is in a different scope)
    const eligibleStudents = allStudents.filter((s) => {
      if (!examData.className || !examData.section) return true; // global exam — everyone gets a score
      const tierPct = examPctByEmail[s.email];
      // Match by sample-student's className/section; primary student is in 6th A
      if (s.email === 'student@edubridge.edu') return examData.className === '6th' && examData.section === 'A';
      const def = sampleStudentDefs.find((d) => d.email === s.email);
      if (!def) return false;
      return def.className === examData.className && def.section === examData.section;
    });

    for (const stu of eligibleStudents) {
      const tierPct = examPctByEmail[stu.email];
      const pct = tierPct !== undefined
        ? tierPct
        : Math.max(20, Math.min(100, Math.round(60 + (rand() - 0.5) * 60)));
      const marks = Math.round((pct / 100) * exam.maxMarks);

      await prisma.examScore.create({
        data: {
          examId: exam.id,
          studentId: stu.id,
          marks,
        },
      });
    }
  }

  // Final count
  const totalStudents = await prisma.user.count({ where: { role: 'student' } });
  const totalQuizzes = await prisma.quiz.count();
  const totalAttempts = await prisma.quizAttempt.count();
  const totalExams = await prisma.exam.count();
  const totalExamScores = await prisma.examScore.count();

  console.log(`✅ Seed complete!`);
  console.log(`   📊 ${totalStudents} student account(s) (1 primary + ${sampleStudentDefs.length} sample classroom)`);
  console.log(`   📝 ${totalQuizzes} quizzes, ${totalAttempts} quiz attempts`);
  console.log(`   📋 ${totalExams} exams, ${totalExamScores} exam scores`);
  console.log(`   🔑 Login: student@edubridge.edu / demo1234  (primary student)`);
  console.log(`   🔑 Login: teacher@edubridge.edu / demo1234  (teacher — see sample roster with gap indicators!)`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
