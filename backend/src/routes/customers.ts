import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all customers with search
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post(
  '/',
  authenticate,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('address').optional({ checkFalsy: true }).trim(),
    body('city').optional({ checkFalsy: true }).trim(),
    body('state').optional({ checkFalsy: true }).trim(),
    body('zipCode').optional({ checkFalsy: true }).trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

      const customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null
        }
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Create customer error:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'A customer with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

// Update customer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const customerData = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: customerData
    });

    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({ where: { id } });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
