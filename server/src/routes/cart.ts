/**
 * Cart Routes - Manage user shopping carts
 */

import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../error-handler.js';
import { logger } from '../logger.js';
import { csrfProtection } from '../csrf.js';

const router = Router();

// Helper to get user ID from session/request
// For now, we'll use email as identifier until we have proper session management
function getUserId(req: Request): number | null {
  // TODO: Implement proper session management
  // For now, we'll use a cookie or header to identify the user
  // This should be replaced with proper JWT/session management
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) return null;
  
  // In a real implementation, we'd look up the user by email and return their ID
  // For now, we'll return null and handle it in the routes
  return null;
}

// Helper to get or create user by email
async function getOrCreateUserByEmail(email: string): Promise<number | null> {
  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as [any[], any];
    
    if (users.length > 0) {
      return users[0].id;
    }
    
    // Create user if doesn't exist
    const [result] = await pool.query(
      'INSERT INTO users (email, full_name) VALUES (?, ?)',
      [email, email.split('@')[0]] // Use email prefix as name
    ) as [any, any];
    
    return result.insertId;
  } catch (error) {
    logger.error('Error getting/creating user', { error, email });
    return null;
  }
}

// Get user cart
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ ok: false, error: 'User email required' });
    }

    const userId = await getOrCreateUserByEmail(userEmail);
    if (!userId) {
      return res.status(500).json({ ok: false, error: 'Failed to get user' });
    }

    const [cartItems] = await pool.query(
      `SELECT 
        ci.id,
        ci.product_id,
        COALESCE(p.title, ci.name) as name,
        ci.price,
        ci.quantity,
        COALESCE(p.imageUrl, ci.image_url) as imageUrl,
        COALESCE(p.category, ci.category) as category,
        p.salePrice,
        p.price as originalPrice
      FROM user_carts ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC`,
      [userId]
    ) as [any[], any];

    const cart = cartItems.map(item => ({
      id: item.product_id || item.id, // Use product_id as the main ID
      cartItemId: item.id, // Keep cart item ID for updates/deletes
      name: item.name || 'Unknown Product',
      price: Number(item.price),
      quantity: item.quantity,
      imageUrl: item.imageUrl || '',
      category: item.category || 'general',
      salePrice: item.salePrice ? Number(item.salePrice) : null,
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
    }));

    res.json({ ok: true, cart });
  })
);

// Add item to cart
router.post(
  '/add',
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ ok: false, error: 'User email required' });
    }

    const { productId, quantity = 1, price, name, imageUrl, category } = req.body;
    
    if (!productId || !price) {
      return res.status(400).json({ ok: false, error: 'Product ID and price required' });
    }

    const userId = await getOrCreateUserByEmail(userEmail);
    if (!userId) {
      return res.status(500).json({ ok: false, error: 'Failed to get user' });
    }

    // Check if item already exists in cart
    const [existing] = await pool.query(
      'SELECT id, quantity FROM user_carts WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    ) as [any[], any];

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + quantity;
      await pool.query(
        'UPDATE user_carts SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, existing[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        `INSERT INTO user_carts (user_id, product_id, price, quantity, name, image_url, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, productId, price, quantity, name || 'Product', imageUrl || '', category || 'general']
      );
    }

    res.json({ ok: true, message: 'Item added to cart' });
  })
);

// Update cart item quantity
router.put(
  '/update/:itemId',
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ ok: false, error: 'User email required' });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ ok: false, error: 'Valid quantity required' });
    }

    const userId = await getOrCreateUserByEmail(userEmail);
    if (!userId) {
      return res.status(500).json({ ok: false, error: 'Failed to get user' });
    }

    if (quantity === 0) {
      // Remove item
      await pool.query(
        'DELETE FROM user_carts WHERE id = ? AND user_id = ?',
        [itemId, userId]
      );
    } else {
      // Update quantity
      await pool.query(
        'UPDATE user_carts SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [quantity, itemId, userId]
      );
    }

    res.json({ ok: true, message: 'Cart updated' });
  })
);

// Remove item from cart
router.delete(
  '/remove/:itemId',
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ ok: false, error: 'User email required' });
    }

    const { itemId } = req.params;
    const userId = await getOrCreateUserByEmail(userEmail);
    if (!userId) {
      return res.status(500).json({ ok: false, error: 'Failed to get user' });
    }

    await pool.query(
      'DELETE FROM user_carts WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    res.json({ ok: true, message: 'Item removed from cart' });
  })
);

// Clear cart
router.delete(
  '/clear',
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.headers['x-user-email'] as string;
    if (!userEmail) {
      return res.status(401).json({ ok: false, error: 'User email required' });
    }

    const userId = await getOrCreateUserByEmail(userEmail);
    if (!userId) {
      return res.status(500).json({ ok: false, error: 'Failed to get user' });
    }

    await pool.query(
      'DELETE FROM user_carts WHERE user_id = ?',
      [userId]
    );

    res.json({ ok: true, message: 'Cart cleared' });
  })
);

export default router;

