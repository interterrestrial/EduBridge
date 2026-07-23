import { Router } from 'express';
import { uploadNote, getNotes } from '../controllers/note.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/upload', upload.single('file'), uploadNote);
router.get('/student/:studentId', getNotes);

export default router;
