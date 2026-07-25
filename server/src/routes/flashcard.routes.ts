import { Router } from 'express';
import { generateFlashcards, getFlashcards, updateFlashcard, deleteFlashcard } from '../controllers/flashcard.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

router.use(authenticate, requireRole('student'));

router.post('/generate', generateFlashcards);
router.get('/student/:studentId', getFlashcards);
router.patch('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;
