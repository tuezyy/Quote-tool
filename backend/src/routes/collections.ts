import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        styles: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(collections);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get single collection
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        styles: true,
        _count: {
          select: { products: true }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create collection (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      const collection = await prisma.collection.create({
        data: { name, description }
      });

      res.status(201).json(collection);
    } catch (error) {
      console.error('Create collection error:', error);
      res.status(500).json({ error: 'Failed to create collection' });
    }
  }
);

// Update collection (admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      const collection = await prisma.collection.update({
        where: { id },
        data: { name, description }
      });

      res.json(collection);
    } catch (error) {
      console.error('Update collection error:', error);
      res.status(500).json({ error: 'Failed to update collection' });
    }
  }
);

// Delete collection (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.collection.delete({ where: { id } });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;
