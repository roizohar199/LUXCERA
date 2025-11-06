/**
 * Public Products Routes - For frontend
 */

import { Router } from 'express';
import { products } from '../db.js';
import { asyncHandler } from '../error-handler.js';

const router = Router();

// Get all active products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const allProducts = await products.getAll(true);
    res.json({ ok: true, products: allProducts });
  })
);

// Get products by category
router.get(
  '/category/:category',
  asyncHandler(async (req, res) => {
    const { category } = req.params;
    const categoryProducts = await products.getByCategory(category, true);
    res.json({ ok: true, products: categoryProducts });
  })
);

// Get single product
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const product = await products.getById(id);

    if (!product || !product.isActive) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    res.json({ ok: true, product });
  })
);

export default router;
