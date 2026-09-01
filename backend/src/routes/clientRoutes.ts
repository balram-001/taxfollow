import { Router } from 'express';
import { createClient, getClients, deleteClient } from '../controllers/clientController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createClient);
router.get('/', protect, getClients);
router.delete('/:id', protect, deleteClient);

export default router;