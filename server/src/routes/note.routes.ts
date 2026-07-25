import { Router } from 'express';
import { uploadNote, getNotes, deleteNote } from '../controllers/note.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate, requireRole('student'));

router.post('/upload', upload.single('file'), uploadNote);
router.get('/student/:studentId', getNotes);
router.delete('/:noteId', deleteNote);

export default router;
