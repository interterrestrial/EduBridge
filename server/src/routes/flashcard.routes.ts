import { Router } from 'express';
import { generateFlashcards, getFlashcards } from '../controllers/flashcard.controller';

const router = Router();

router.post('/generate', generateFlashcards);
router.get('/student/:studentId', getFlashcards);

export default router;
