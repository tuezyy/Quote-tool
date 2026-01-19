import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { collectionId, category, categoryGroup, search, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (collectionId) {
      where.collectionId = collectionId;
    }

    // Exact category match
    if (category) {
      where.category = category;
    }

    // Category group pattern matching
    if (categoryGroup) {
      const group = categoryGroup as string;
      switch (group) {
        case 'wall':
          where.category = { contains: 'WALL', mode: 'insensitive' };
          break;
        case 'base':
          where.AND = [
            { category: { contains: 'BASE', mode: 'insensitive' } },
            { category: { not: { contains: 'VANITY', mode: 'insensitive' } } }
          ];
          break;
        case 'vanity':
          where.category = { contains: 'VANITY', mode: 'insensitive' };
          break;
        case 'utility':
          where.OR = [
            { category: { contains: 'UTILITY', mode: 'insensitive' } },
            { category: { contains: 'OVEN', mode: 'insensitive' } },
            { category: { contains: 'MICROWAVE', mode: 'insensitive' } }
          ];
          break;
        case 'corner':
          where.category = { contains: 'CORNER', mode: 'insensitive' };
          break;
        case 'drawer':
          where.AND = [
            { category: { contains: 'DRAWER', mode: 'insensitive' } },
            { category: { not: { contains: 'VANITY', mode: 'insensitive' } } }
          ];
          break;
        case 'sink':
          where.AND = [
            { category: { contains: 'SINK', mode: 'insensitive' } },
            { category: { not: { contains: 'VANITY', mode: 'insensitive' } } }
          ];
          break;
        case 'ada':
          where.category = { contains: 'ADA', mode: 'insensitive' };
          break;
        case 'accessory':
          where.category = { contains: 'ACCESSORY', mode: 'insensitive' };
          break;
      }
    }

    if (search) {
      const searchCondition = {
        OR: [
          { itemCode: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      };
      if (where.AND) {
        where.AND.push(searchCondition);
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          collection: true
        },
        orderBy: [
          { category: 'asc' },
          { itemCode: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        collection: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('collectionId').isUUID(),
    body('itemCode').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('msrp').isDecimal(),
    body('price').isDecimal()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const productData = req.body;

      const product = await prisma.product.create({
        data: productData
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: productData
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get all unique categories
router.get('/categories/all', async (req, res) => {
  try {
    const { collectionId } = req.query;

    const where: any = {};
    if (collectionId) {
      where.collectionId = collectionId;
    }

    const products = await prisma.product.findMany({
      where,
      select: { category: true },
      distinct: ['category']
    });

    const categories = products.map(p => p.category).sort();

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get product categories for a collection (legacy endpoint)
router.get('/categories/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;

    const products = await prisma.product.findMany({
      where: { collectionId },
      select: { category: true },
      distinct: ['category']
    });

    const categories = products.map(p => p.category).sort();

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
