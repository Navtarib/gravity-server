import express from 'express';
import { 
  getProducts, 
  getAllProductsAdmin, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (for QR ordering users)
router.get('/', getProducts);

// Admin only routes
router.get('/admin', protect, adminOnly, getAllProductsAdmin);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
