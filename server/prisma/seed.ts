import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduBridge demo data...');

  // Idempotency: delete any prior demo users (and their cascaded data) so
  // re-seeding never collides on the hardcoded ids when emails changed
  // between seed versions. All studentId relations cascade on user delete.
  await prisma.user.deleteMany({ where: { id: { in: ['student_1', 'teacher_1'] } } });

  // 1. Demo student
  const studentPassword = await hashPassword('demo1234');
  const student = await prisma.user.upsert({
    where: { email: 'student@edubridge.edu' },
    update: {},
    create: {
      id: 'student_1',
      name: 'Yash Sharma',
      email: 'student@edubridge.edu',
      password: studentPassword,
      role: 'student',
      studentProfile: { create: { institution: 'Tech Institute of Engineering', course: 'Computer Science & Data Analytics', semester: '6', totalStudyHours: 42 } },
    },
  });

  // 2. Demo teacher
  const teacherPassword = await hashPassword('demo1234');
  await prisma.user.upsert({
    where: { email: 'teacher@edubridge.edu' },
    update: {},
    create: {
      id: 'teacher_1',
      name: 'Prof. Verma',
      email: 'teacher@edubridge.edu',
      password: teacherPassword,
      role: 'teacher',
      teacherProfile: { create: { organization: 'Tech Institute', department: 'Computer Science', specialization: 'Algorithms', experience: 12 } },
    },
  });

  // 3. Note folders
  const folderDataPrep = await prisma.noteFolder.upsert({
    where: { id: 'folder_dataprep' },
    update: {},
    create: { id: 'folder_dataprep', name: 'Data Preprocessing & Analytics', color: '#6366f1', studentId: student.id },
  });
  const folderAlgo = await prisma.noteFolder.upsert({
    where: { id: 'folder_algo' },
    update: {},
    create: { id: 'folder_algo', name: 'Design & Analysis of Algorithms', color: '#ec4899', studentId: student.id },
  });
  const folderDB = await prisma.noteFolder.upsert({
    where: { id: 'folder_db' },
    update: {},
    create: { id: 'folder_db', name: 'Database Systems & Indexing', color: '#10b981', studentId: student.id },
  });

  // 4. Notes (filePath points to placeholder files; actual indexing happens via upload API)
  await prisma.note.upsert({
    where: { id: 'note_binning' },
    update: {},
    create: { id: 'note_binning', title: 'Equal-Width & Equal-Frequency Binning', filePath: 'uploads/binning_and_classing_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_outlier' },
    update: {},
    create: { id: 'note_outlier', title: 'Outlier Detection & IQR Method', filePath: 'uploads/outlier_detection_notes.txt', fileType: '.txt', folderId: folderDataPrep.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_master' },
    update: {},
    create: { id: 'note_master', title: 'Asymptotic Complexity & Recurrence Relations', filePath: 'uploads/master_theorem_notes.txt', fileType: '.txt', folderId: folderAlgo.id, studentId: student.id },
  });
  await prisma.note.upsert({
    where: { id: 'note_bplus' },
    update: {},
    create: { id: 'note_bplus', title: 'B+ Tree Indexing & Storage Engines', filePath: 'uploads/bplus_tree_notes.txt', fileType: '.txt', folderId: folderDB.id, studentId: student.id },
  });

  // 5. Flashcard decks
  const deck1 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_dataprep' },
    update: {},
    create: { id: 'deck_dataprep', name: 'Data Preprocessing & Binning Deck', topic: 'Binning', studentId: student.id, noteId: 'note_binning' },
  });
  const deck2 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_algo' },
    update: {},
    create: { id: 'deck_algo', name: 'Algorithms & Complexity Deck', topic: 'Complexity', studentId: student.id, noteId: 'note_master' },
  });
  const deck3 = await prisma.flashcardFolder.upsert({
    where: { id: 'deck_db' },
    update: {},
    create: { id: 'deck_db', name: 'B+ Tree & Indexing Deck', topic: 'Indexing', studentId: student.id, noteId: 'note_bplus' },
  });

  // 6. Flashcards
  await prisma.flashcard.createMany({
    data: [
      { question: 'What is equal-width binning?', answer: 'Dividing the value range into k intervals of equal width.', topic: 'Binning', type: 'definition', folderId: deck1.id, noteId: 'note_binning', studentId: student.id },
      { question: 'Define equal-frequency binning.', answer: 'Each bin contains the same number of data points (quantiles).', topic: 'Binning', type: 'concept', folderId: deck1.id, noteId: 'note_binning', studentId: student.id },
      { question: 'Formula for IQR.', answer: 'IQR = Q3 - Q1', topic: 'Outliers', type: 'formula', folderId: deck1.id, noteId: 'note_outlier', studentId: student.id },
      { question: 'What is the Master Theorem?', answer: 'A method for solving recurrences of the form T(n)=aT(n/b)+f(n).', topic: 'Complexity', type: 'definition', folderId: deck2.id, noteId: 'note_master', studentId: student.id },
      { question: 'B+ tree vs B-tree?', answer: 'B+ tree stores data only in leaves; internal nodes are index-only.', topic: 'Indexing', type: 'comparison', folderId: deck3.id, noteId: 'note_bplus', studentId: student.id },
      { question: 'Define asymptotic notation.', answer: 'Describes behavior of functions as input size approaches infinity.', topic: 'Complexity', type: 'definition', folderId: deck2.id, noteId: 'note_master', studentId: student.id },
      { question: 'Why use a B+ tree for DB indexes?', answer: 'High fanout, low height, fast range queries via linked leaves.', topic: 'Indexing', type: 'concept', folderId: deck3.id, noteId: 'note_bplus', studentId: student.id },
    ],
  });

  console.log('✅ Seed complete. Login: student@edubridge.edu / demo1234 (student), teacher@edubridge.edu / demo1234 (teacher)');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
