import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listMyEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = Router();

router.use(requireAuth);
router.get('/', listMyEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;


