import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (admin only) — scoped to this business
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { businessId: req.businessId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullname').trim().notEmpty(),
    body('role').isIn(['INSTALLER', 'ADMIN'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullname, role, phone } = req.body;
      const businessId = (req as AuthRequest).businessId;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user scoped to this business
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullname,
          role,
          phone: phone || null,
          businessId: businessId || undefined,
        },
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
          phone: true,
          isAvailable: true,
          createdAt: true
        }
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Update user (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, fullname, role, phone, isAvailable } = req.body;

    const updateData: any = {};

    if (email) updateData.email = email;
    if (fullname) updateData.fullname = fullname;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone || null;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        isAvailable: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
