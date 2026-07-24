import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import {
  createNoteFolder,
  getNoteFolders,
  updateNoteFolder,
  deleteNoteFolder,
  moveNoteToFolder,
  createFlashcardFolder,
  getFlashcardFolders,
  updateFlashcardFolder,
  deleteFlashcardFolder,
  moveFlashcardToFolder,
} from '../controllers/folder.controller';

const router = Router();

router.use(authenticate, requireRole('student'));

// Note Folders
router.post('/notes', createNoteFolder);
router.get('/notes/student/:studentId', getNoteFolders);
router.patch('/notes/:folderId', updateNoteFolder);
router.delete('/notes/:folderId', deleteNoteFolder);
router.patch('/notes/:noteId/move', moveNoteToFolder);

// Flashcard Folders / Decks
router.post('/flashcards', createFlashcardFolder);
router.get('/flashcards/student/:studentId', getFlashcardFolders);
router.patch('/flashcards/:folderId', updateFlashcardFolder);
router.delete('/flashcards/:folderId', deleteFlashcardFolder);
router.patch('/flashcards/:cardId/move', moveFlashcardToFolder);

export default router;
