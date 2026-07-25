import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  clearNotifications,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear', clearNotifications);

export default router;
