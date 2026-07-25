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
      teacherProfile: { create: { organization: 'Tech Institute', department: 'Computer Science', specialization: 'Algorithms', experience: 12 } },
    },
  });

  // --- 3. Yash's folders, notes, flashcards (same as before) ---
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

  // ===========================================================================
  // --- 5. SYNTHETIC STUDENTS (generated, not hardcoded) ---
  // Each gets: a profile, 2-4 notes, 1-3 quizzes with attempts (varied accuracy
  // → different mastery levels + weak topics → populates the heatmap), and
  // attendance records. This makes the teacher dashboard look alive on demo day.
  // ===========================================================================

  const NUM_SYNTHETIC = 12;
  console.log(`   Generating ${NUM_SYNTHETIC} synthetic students...`);

  for (let i = 0; i < NUM_SYNTHETIC; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.edubridge.edu`;

    // Skip if email already exists (idempotency on re-run after deleteMany missed it)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    // Assign a skill tier so we get a spread: some excelling, some on track, some struggling
    const tier = rand();
    const baseAccuracy = tier < 0.25 ? randInt(35, 55)   // struggling
                        : tier < 0.65 ? randInt(55, 75)   // on track
                        : randInt(78, 95);                 // excelling

    const studyHours = randInt(5, 60);
    const semester = String(randInt(3, 8));

    const synthStudent = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: studentPassword,
        role: 'student',
        studentProfile: { create: { institution: 'Tech Institute of Engineering', course: 'Computer Science & Data Analytics', semester, totalStudyHours: studyHours } },
      },
    });

    // 2-4 notes across random subjects
    const noteCount = randInt(2, 4);
    const studentNotes: { id: string }[] = [];
    for (let n = 0; n < noteCount; n++) {
      const subject = pick(SUBJECTS);
      const topicList = TOPICS[subject as keyof typeof TOPICS];
      const topic = pick(topicList);
      const note = await prisma.note.create({
        data: {
          title: `${topic} — Study Notes`,
          filePath: `uploads/synth_${i}_${n}.txt`,
          fileType: '.txt',
          studentId: synthStudent.id,
        },
      });
      studentNotes.push(note);
    }

    // 1-3 quizzes with attempts — varied accuracy creates weak topics
    const quizCount = randInt(1, 3);
    for (let q = 0; q < quizCount; q++) {
      const subject = pick(SUBJECTS);
      const topicList = TOPICS[subject as keyof typeof TOPICS];
      const quizTopic = pick(topicList);

      // Build a 5-question quiz
      const questions = Array.from({ length: 5 }, (_, qi) => {
        const qt = pick(topicList);
        return {
          question: `Question about ${qt} (#${qi + 1})`,
          optionA: 'Option A', optionB: 'Option B', optionC: 'Option C', optionD: 'Option D',
          correctAnswer: 'A',
          explanation: `${qt} concept explanation.`,
          topic: qt,
        };
      });

      const quiz = await prisma.quiz.create({
        data: {
          title: `${subject} — Practice Quiz ${q + 1}`,
          difficulty: pick(['easy', 'medium', 'hard']),
          questionsJson: JSON.stringify(questions),
          studentId: synthStudent.id,
        },
      });

      // Simulate the attempt: some questions right, some wrong (accuracy ~ baseAccuracy ± jitter)
      const jitter = randInt(-10, 10);
      const accuracy = Math.max(0, Math.min(100, baseAccuracy + jitter));
      const correct = Math.round((accuracy / 100) * questions.length);
      const wrong = questions.length - correct;

      // Weak topics = topics from the questions they got wrong
      const weakTopics = questions.slice(correct).map((q) => q.topic);
      // Deduplicate
      const uniqueWeak = [...new Set(weakTopics)];

      await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId: synthStudent.id,
          score: correct,
          totalQuestions: questions.length,
          accuracy,
          weakTopicsJson: JSON.stringify(uniqueWeak.length > 0 ? uniqueWeak : ['Fundamentals']),
        },
      });
    }

    // Attendance: 5-10 records, ~80% present
    const attendanceCount = randInt(5, 10);
    for (let a = 0; a < attendanceCount; a++) {
      const date = `2026-0${randInt(1, 7)}-${String(randInt(1, 28)).padStart(2, '0')}`;
      await prisma.attendanceRecord.create({
        data: {
          studentId: synthStudent.id,
          subject: pick(SUBJECTS),
          status: rand() < 0.8 ? 'present' : 'absent',
          date,
        },
      });
    }
  }

  // --- 6. Exams & Exam Scores (teacher creates 2-3 exams, all students get scores) ---
  const EXAMS = [
    { title: 'Midterm Exam 1', subject: 'Data Preprocessing & Analytics', maxMarks: 100, examDate: '2026-07-15' },
    { title: 'Midterm Exam 2', subject: 'Design & Analysis of Algorithms', maxMarks: 100, examDate: '2026-07-22' },
    { title: 'Final Exam', subject: 'Database Systems & Indexing', maxMarks: 100, examDate: '2026-08-01' },
  ];

  console.log('   Generating exams and scores...');
  const allStudents = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true } });

  for (const examData of EXAMS) {
    const exam = await prisma.exam.create({
      data: {
        title: examData.title,
        subject: examData.subject,
        maxMarks: examData.maxMarks,
        examDate: examData.examDate,
        teacherId: teacher.id,
      },
    });

    // Give each student a score with some correlation to their quiz tier
    for (const stu of allStudents) {
      // Base score around 60% with variation based on their tier
      // We can't easily access tier here, so use a deterministic per-student factor
      const studentFactor = (rand() - 0.5) * 0.6; // -30% to +30% around base
      const basePct = 60;
      const pct = Math.max(20, Math.min(100, Math.round(basePct + studentFactor * 100)));
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

  // --- 7. Teacher pushes a sample assignment to Yash (demo of the feature) ---
  const existingPush = await prisma.teacherPushAssignment.findFirst({
    where: { teacherId: teacher.id, studentId: student.id },
  });
  if (!existingPush) {
    await prisma.teacherPushAssignment.create({
      data: {
        teacherId: teacher.id,
        studentId: student.id,
        title: 'Review B+ Tree Indexing',
        noteId: notes[3].id,
        dueDate: 'End of Week',
        status: 'pending',
      },
    });
  }

  // Final count
  const totalStudents = await prisma.user.count({ where: { role: 'student' } });
  const totalQuizzes = await prisma.quiz.count();
  const totalAttempts = await prisma.quizAttempt.count();
  const totalExams = await prisma.exam.count();
  const totalExamScores = await prisma.examScore.count();

  console.log(`✅ Seed complete!`);
  console.log(`   📊 ${totalStudents} students (1 primary + ${NUM_SYNTHETIC} synthetic)`);
  console.log(`   📝 ${totalQuizzes} quizzes, ${totalAttempts} quiz attempts`);
  console.log(`   📋 ${totalExams} exams, ${totalExamScores} exam scores`);
  console.log(`   🔑 Login: student@edubridge.edu / demo1234  (primary student)`);
  console.log(`   🔑 Login: teacher@edubridge.edu / demo1234  (teacher — see full roster + heatmap + exams)`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
