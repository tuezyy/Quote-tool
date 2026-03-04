import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullname').trim().notEmpty(),
    body('role').optional().isIn(['INSTALLER', 'ADMIN'])
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullname, role, businessId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Resolve businessId — from body, or fall back to first business
      let resolvedBusinessId = businessId;
      if (!resolvedBusinessId) {
        const biz = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
        resolvedBusinessId = biz?.id || '';
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullname,
          role: role || 'INSTALLER',
          businessId: resolvedBusinessId || null,
        }
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        businessId: user.businessId || '',
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user (globally by email — users are globally unique)
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        businessId: user.businessId || '',
        email: user.email,
        role: user.role
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

export default router;
