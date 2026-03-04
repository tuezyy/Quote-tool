import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all settings for this business
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { businessId: req.businessId },
    });

    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update setting (admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const businessId = req.businessId;

    const setting = await prisma.setting.upsert({
      where: { businessId_key: { businessId: businessId || '', key } },
      update: { value },
      create: { key, value, businessId: businessId || undefined }
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
