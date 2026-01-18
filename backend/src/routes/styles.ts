import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all styles (optionally filter by collection)
router.get('/', async (req, res) => {
  try {
    const { collectionId } = req.query;

    const styles = await prisma.style.findMany({
      where: collectionId ? { collectionId: collectionId as string } : undefined,
      include: {
        collection: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(styles);
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

// Get single style
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const style = await prisma.style.findUnique({
      where: { id },
      include: {
        collection: true
      }
    });

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
    }

    res.json(style);
  } catch (error) {
    console.error('Get style error:', error);
    res.status(500).json({ error: 'Failed to fetch style' });
  }
});

// Create style (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('collectionId').isUUID(),
    body('code').trim().notEmpty(),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { collectionId, code, name } = req.body;

      const style = await prisma.style.create({
        data: { collectionId, code, name }
      });

      res.status(201).json(style);
    } catch (error) {
      console.error('Create style error:', error);
      res.status(500).json({ error: 'Failed to create style' });
    }
  }
);

// Update style (admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('code').optional().trim().notEmpty(),
    body('name').optional().trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { code, name } = req.body;

      const style = await prisma.style.update({
        where: { id },
        data: { code, name }
      });

      res.json(style);
    } catch (error) {
      console.error('Update style error:', error);
      res.status(500).json({ error: 'Failed to update style' });
    }
  }
);

// Delete style (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.style.delete({ where: { id } });

    res.json({ message: 'Style deleted successfully' });
  } catch (error) {
    console.error('Delete style error:', error);
    res.status(500).json({ error: 'Failed to delete style' });
  }
});

export default router;
