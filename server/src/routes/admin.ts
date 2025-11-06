/**
 * Admin Routes - Protected routes for CMS
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../db.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../error-handler.js';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get all products (admin view - includes inactive)
router.get(
  '/products',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const allProducts = await products.getAll(false);
    res.json({ ok: true, products: allProducts });
  })
);

// Get single product
router.get(
  '/products/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    const product = await products.getById(id);

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    res.json({ ok: true, product });
  })
);

// Create product
router.post(
  '/products',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const { title, description, price, salePrice, imageUrl, category, isActive } = req.body;

    if (!title || !price || !imageUrl) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: title, price, imageUrl' });
    }

    const product = await products.create({
      title,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      imageUrl,
      category,
      isActive: isActive !== false,
    });

    logger.info('Product created', { productId: product.id, title: product.title, username: req.user?.username });
    res.status(201).json({ ok: true, product });
  })
);

// Update product
router.put(
  '/products/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    const existing = await products.getById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    const updates: any = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
    if (req.body.salePrice !== undefined) updates.salePrice = req.body.salePrice ? parseFloat(req.body.salePrice) : null;
    if (req.body.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    const product = await products.update(id, updates);

    logger.info('Product updated', { productId: id, username: req.user?.username });
    res.json({ ok: true, product });
  })
);

// Delete product
router.delete(
  '/products/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    const product = await products.getById(id);

    if (!product) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    await products.delete(id);
    logger.info('Product deleted', { productId: id, username: req.user?.username });
    res.status(204).end();
  })
);

// Upload image
router.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    // Return URL relative to server root
    const url = `/uploads/${req.file.filename}`;
    logger.info('File uploaded', { filename: req.file.filename, username: req.user?.username });
    res.json({ ok: true, url });
  })
);

export default router;
