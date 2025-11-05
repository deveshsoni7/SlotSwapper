import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listSwappableSlots, requestSwap, respondSwap, listIncoming, listOutgoing } from '../controllers/swapController.js';

const router = Router();

router.get('/swappable-slots', requireAuth, listSwappableSlots);
router.post('/swap-request', requireAuth, requestSwap);
router.post('/swap-response/:requestId', requireAuth, respondSwap);
router.get('/swap-requests/incoming', requireAuth, listIncoming);
router.get('/swap-requests/outgoing', requireAuth, listOutgoing);

export default router;


