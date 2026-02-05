import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateQuotePDF } from '../utils/pdfGenerator';

const router = Router();

// Generate quote number
const generateQuoteNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: {
      quoteNumber: {
        startsWith: `Q-${year}-`
      }
    }
  });
  const nextNumber = (count + 1).toString().padStart(4, '0');
  return `Q-${year}-${nextNumber}`;
};

// Get all quotes with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, customerId, userId, startDate, endDate, search, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      where.quoteNumber = { contains: search as string, mode: 'insensitive' };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: true,
          user: { select: { id: true, fullname: true, email: true } },
          collection: true,
          style: true,
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.quote.count({ where })
    ]);

    res.json({
      quotes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      error: 'Failed to fetch quotes',
      details: error?.message || 'Unknown error',
      code: error?.code
    });
  }
});

// Get single quote
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, fullname: true, email: true } },
        collection: true,
        style: true,
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Create quote
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      customerId,
      collectionId,
      styleId,
      items,
      taxRate,
      notes,
      installationFee = 0,
      miscExpenses = 0,
      msrpTotal = 0,
      clientCabinetPrice  // What we charge customer (can be different from wholesale cost)
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate wholesale subtotal (our cost)
    let subtotal = 0;
    for (const item of items) {
      const lineTotal = parseFloat(item.unitPrice) * item.quantity;
      subtotal += lineTotal;
    }

    // Client cabinet price - what we charge customer
    // If not provided, use subtotal (no markup)
    const finalClientPrice = clientCabinetPrice !== undefined ? parseFloat(clientCabinetPrice) : subtotal;
    const installFee = parseFloat(installationFee) || 0;
    const miscFee = parseFloat(miscExpenses) || 0;

    // Client subtotal = cabinet price + installation + misc (all charges to customer)
    const clientSubtotal = finalClientPrice + installFee + miscFee;

    // Tax is calculated on what customer pays (cabinet + installation + misc)
    const taxAmount = clientSubtotal * parseFloat(taxRate);
    const total = clientSubtotal + taxAmount;

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        userId: req.user.userId,
        collectionId,
        styleId,
        subtotal,                                        // Wholesale cost (what we pay)
        clientCabinetPrice: finalClientPrice,            // What we charge customer for cabinets
        taxRate: parseFloat(taxRate),
        taxAmount,
        total,                                           // Client total = subtotal + tax
        installationFee: installFee,                     // Charged to customer
        miscExpenses: miscFee,                           // Charged to customer
        msrpTotal: parseFloat(msrpTotal) || 0,              // Retail value for savings display
        notes,
        expiresAt,
        status: 'DRAFT',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            lineTotal: parseFloat(item.unitPrice) * item.quantity,
            roomName: item.roomName,
            notes: item.notes
          }))
        }
      },
      include: {
        customer: true,
        collection: true,
        style: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(quote);
  } catch (error: any) {
    console.error('Create quote error:', error);
    res.status(500).json({
      error: 'Failed to create quote',
      details: error?.message || 'Unknown error',
      code: error?.code
    });
  }
});

// Update quote
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, taxRate, notes, ...quoteData } = req.body;

    // If items are being updated, recalculate totals
    if (items) {
      let subtotal = 0;
      for (const item of items) {
        const lineTotal = parseFloat(item.unitPrice) * item.quantity;
        subtotal += lineTotal;
      }

      const rate = taxRate ? parseFloat(taxRate) : 0;
      const taxAmount = subtotal * rate;
      const total = subtotal + taxAmount;

      quoteData.subtotal = subtotal;
      quoteData.taxRate = rate;
      quoteData.taxAmount = taxAmount;
      quoteData.total = total;
    }

    if (notes !== undefined) {
      quoteData.notes = notes;
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: quoteData,
      include: {
        customer: true,
        collection: true,
        style: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(quote);
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// Update quote status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    if (status === 'SENT') {
      updateData.sentAt = new Date();
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData
    });

    res.json(quote);
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ error: 'Failed to update quote status' });
  }
});

// Duplicate quote
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get original quote
    const original = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!original) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Generate new quote number
    const quoteNumber = await generateQuoteNumber();

    // Create duplicate
    const duplicate = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: original.customerId,
        userId: req.user.userId,
        collectionId: original.collectionId,
        styleId: original.styleId,
        subtotal: original.subtotal,
        clientCabinetPrice: original.clientCabinetPrice,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        total: original.total,
        installationFee: original.installationFee,
        miscExpenses: original.miscExpenses,
        msrpTotal: original.msrpTotal,
        notes: original.notes,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        items: {
          create: original.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            roomName: item.roomName,
            notes: item.notes
          }))
        }
      },
      include: {
        customer: true,
        collection: true,
        style: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(duplicate);
  } catch (error) {
    console.error('Duplicate quote error:', error);
    res.status(500).json({ error: 'Failed to duplicate quote' });
  }
});

// Delete quote (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.quote.delete({ where: { id } });

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

// Quote items routes
router.post('/:quoteId/items', authenticate, async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { productId, quantity, unitPrice, roomName, notes } = req.body;

    const lineTotal = parseFloat(unitPrice) * quantity;

    const item = await prisma.quoteItem.create({
      data: {
        quoteId,
        productId,
        quantity,
        unitPrice: parseFloat(unitPrice),
        lineTotal,
        roomName,
        notes
      },
      include: {
        product: true
      }
    });

    // Recalculate quote totals
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true }
    });

    if (quote) {
      const subtotal = quote.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const taxAmount = subtotal * Number(quote.taxRate);
      const total = subtotal + taxAmount;

      await prisma.quote.update({
        where: { id: quoteId },
        data: { subtotal, taxAmount, total }
      });
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Add quote item error:', error);
    res.status(500).json({ error: 'Failed to add quote item' });
  }
});

router.put('/:quoteId/items/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId, quoteId } = req.params;
    const { quantity, unitPrice, roomName, notes } = req.body;

    const lineTotal = parseFloat(unitPrice) * quantity;

    const item = await prisma.quoteItem.update({
      where: { id: itemId },
      data: {
        quantity,
        unitPrice: parseFloat(unitPrice),
        lineTotal,
        roomName,
        notes
      },
      include: {
        product: true
      }
    });

    // Recalculate quote totals
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true }
    });

    if (quote) {
      const subtotal = quote.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const taxAmount = subtotal * Number(quote.taxRate);
      const total = subtotal + taxAmount;

      await prisma.quote.update({
        where: { id: quoteId },
        data: { subtotal, taxAmount, total }
      });
    }

    res.json(item);
  } catch (error) {
    console.error('Update quote item error:', error);
    res.status(500).json({ error: 'Failed to update quote item' });
  }
});

router.delete('/:quoteId/items/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId, quoteId } = req.params;

    await prisma.quoteItem.delete({ where: { id: itemId } });

    // Recalculate quote totals
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true }
    });

    if (quote) {
      const subtotal = quote.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const taxAmount = subtotal * Number(quote.taxRate);
      const total = subtotal + taxAmount;

      await prisma.quote.update({
        where: { id: quoteId },
        data: { subtotal, taxAmount, total }
      });
    }

    res.json({ message: 'Quote item deleted successfully' });
  } catch (error) {
    console.error('Delete quote item error:', error);
    res.status(500).json({ error: 'Failed to delete quote item' });
  }
});

// Generate PDF for quote
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientView } = req.query;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        collection: true,
        style: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get company info from settings
    const settings = await prisma.setting.findMany();
    const companyInfo = {
      name: settings.find(s => s.key === 'company_name')?.value || 'Cabinet Quoting Company',
      email: settings.find(s => s.key === 'company_email')?.value || 'info@cabinetquoting.com',
      phone: settings.find(s => s.key === 'company_phone')?.value || '(555) 123-4567',
      address: settings.find(s => s.key === 'company_address')?.value
    };

    // Transform data for PDF generator
    const pdfData = {
      quoteNumber: quote.quoteNumber,
      createdAt: quote.createdAt,
      customer: {
        firstName: quote.customer.firstName,
        lastName: quote.customer.lastName,
        email: quote.customer.email,
        phone: quote.customer.phone,
        address: quote.customer.address || undefined,
        city: quote.customer.city || undefined,
        state: quote.customer.state || undefined,
        zipCode: quote.customer.zipCode || undefined
      },
      collection: {
        name: quote.collection.name
      },
      style: {
        name: quote.style.name
      },
      items: quote.items.map(item => ({
        product: {
          itemCode: item.product.itemCode,
          description: item.product.description,
          msrp: Number(item.product.msrp)
        },
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.lineTotal)
      })),
      subtotal: Number(quote.subtotal),
      clientCabinetPrice: Number(quote.clientCabinetPrice),
      taxRate: Number(quote.taxRate),
      taxAmount: Number(quote.taxAmount),
      total: Number(quote.total),
      installationFee: Number(quote.installationFee),
      miscExpenses: Number(quote.miscExpenses),
      msrpTotal: Number(quote.msrpTotal),
      notes: quote.notes || undefined,
      companyInfo,
      clientView: clientView === 'true'
    };

    const pdfStream = generateQuotePDF(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quote.quoteNumber}.pdf"`);

    pdfStream.pipe(res);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Send quote via email
router.post('/:id/send', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Update quote status to SENT
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    // In a real application, you would send an email here using a service like SendGrid, Mailgun, etc.
    // For now, we'll just simulate the email being sent

    // Example email implementation (commented out):
    /*
    const emailService = require('../services/emailService');
    await emailService.sendQuote({
      to: quote.customer.email,
      quoteNumber: quote.quoteNumber,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      total: quote.total,
      pdfAttachment: await generateQuotePDF(quote)
    });
    */

    res.json({
      message: 'Quote sent successfully',
      email: quote.customer.email
    });
  } catch (error) {
    console.error('Send quote error:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

export default router;
