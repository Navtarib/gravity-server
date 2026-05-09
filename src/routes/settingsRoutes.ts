import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, adminOnly, updateSettings);

export default router;
