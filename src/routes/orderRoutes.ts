import express from 'express';
import { 
  placeOrder, 
  getOrders, 
  updateOrderStatus, 
  getDailyStats,
  cancelOrder,
  getMyOrders
} from '../controllers/orderController';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

// User's own order history - Moved to top for priority
router.get('/my-orders', protect, getMyOrders);

// Customer order route - protect use karein taake hamesha userId save ho
router.post('/', protect, placeOrder);

// Admin only routes
router.get('/', protect, adminOnly, getOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.post('/cancel', protect, adminOnly, cancelOrder);
router.get('/stats', protect, adminOnly, getDailyStats);


export default router;
