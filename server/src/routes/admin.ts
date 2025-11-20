/**
 * Admin Routes - Protected routes for CMS
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { products, pool } from '../db.js';
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

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /video\//.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, webm, ogg, mov, avi)'));
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
    const { title, description, price, salePrice, imageUrl, category, isActive, isNew, video_url, video_file, additional_images, colors } = req.body;

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
      isNew: isNew === true,
      video_url: video_url || null,
      video_file: video_file || null,
      additional_images: additional_images || null,
      colors: colors || null,
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
    if (req.body.isNew !== undefined) updates.isNew = req.body.isNew;
    if (req.body.video_url !== undefined) updates.video_url = req.body.video_url || null;
    if (req.body.video_file !== undefined) updates.video_file = req.body.video_file || null;
    if (req.body.additional_images !== undefined) updates.additional_images = req.body.additional_images || null;
    if (req.body.colors !== undefined) updates.colors = req.body.colors || null;

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

// Upload video
router.post(
  '/upload-video',
  requireAdmin,
  videoUpload.single('file'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No video file uploaded' });
    }

    // Return URL relative to server root
    const url = `/uploads/${req.file.filename}`;
    logger.info('Video uploaded', { filename: req.file.filename, username: req.user?.username });
    res.json({ ok: true, url });
  })
);

// ========== PROMOTIONAL BANNERS ROUTES ==========

// Get all banners (admin)
router.get(
  '/banners',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const [banners] = await pool.query(
      'SELECT * FROM promotional_banners ORDER BY created_at DESC'
    ) as [any[], any];
    res.json({ ok: true, banners });
  })
);

// Get single banner (admin)
router.get(
  '/banners/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    const [rows] = await pool.query(
      'SELECT * FROM promotional_banners WHERE id = ?',
      [id]
    ) as [any[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Banner not found' });
    }
    
    res.json({ ok: true, banner: rows[0] });
  })
);

// Create banner
router.post(
  '/banners',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const { title, description, image_url, link_url, discount_percent, is_active, starts_at, ends_at } = req.body;

    if (!title) {
      return res.status(400).json({ ok: false, error: 'Title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO promotional_banners 
       (title, description, image_url, link_url, discount_percent, is_active, starts_at, ends_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        image_url || null,
        link_url || null,
        discount_percent || null,
        is_active !== false ? 1 : 0,
        starts_at || null,
        ends_at || null,
        req.user?.id || null
      ]
    ) as [any, any];

    const [banners] = await pool.query(
      'SELECT * FROM promotional_banners WHERE id = ?',
      [result.insertId]
    ) as [any[], any];

    logger.info('Banner created', { bannerId: result.insertId, title, username: req.user?.username });
    res.status(201).json({ ok: true, banner: banners[0] });
  })
);

// Update banner
router.put(
  '/banners/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    const { title, description, image_url, link_url, discount_percent, is_active, starts_at, ends_at } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM promotional_banners WHERE id = ?',
      [id]
    ) as [any[], any];

    if (existing.length === 0) {
      return res.status(404).json({ ok: false, error: 'Banner not found' });
    }

    await pool.query(
      `UPDATE promotional_banners SET
       title = COALESCE(?, title),
       description = ?,
       image_url = ?,
       link_url = ?,
       discount_percent = ?,
       is_active = COALESCE(?, is_active),
       starts_at = ?,
       ends_at = ?
       WHERE id = ?`,
      [
        title || null,
        description !== undefined ? description : existing[0].description,
        image_url !== undefined ? image_url : existing[0].image_url,
        link_url !== undefined ? link_url : existing[0].link_url,
        discount_percent !== undefined ? discount_percent : existing[0].discount_percent,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        starts_at !== undefined ? starts_at : existing[0].starts_at,
        ends_at !== undefined ? ends_at : existing[0].ends_at,
        id
      ]
    );

    const [updated] = await pool.query(
      'SELECT * FROM promotional_banners WHERE id = ?',
      [id]
    ) as [any[], any];

    logger.info('Banner updated', { bannerId: id, username: req.user?.username });
    res.json({ ok: true, banner: updated[0] });
  })
);

// Delete banner
router.delete(
  '/banners/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = parseInt(req.params.id);
    
    const [existing] = await pool.query(
      'SELECT * FROM promotional_banners WHERE id = ?',
      [id]
    ) as [any[], any];

    if (existing.length === 0) {
      return res.status(404).json({ ok: false, error: 'Banner not found' });
    }

    await pool.query('DELETE FROM promotional_banners WHERE id = ?', [id]);
    
    logger.info('Banner deleted', { bannerId: id, username: req.user?.username });
    res.status(204).end();
  })
);

export default router;
