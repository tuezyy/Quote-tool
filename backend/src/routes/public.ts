import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';

const router = Router();

// ─────────────────────────────────────────────
// GET /api/public/business
// Machine-readable business info for AI agents
// ─────────────────────────────────────────────
router.get('/business', (req, res) => {
  res.json({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Cabinets of Orlando',
    url: 'https://cabinetsoforlando.com',
    telephone: '+18332017849',
    email: 'info@cabinetsoforlando.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Orlando',
      addressRegion: 'FL',
      postalCode: '32801',
      addressCountry: 'US',
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    }],
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card, Check, Financing',
    areaServed: [
      'Orlando, FL', 'Winter Park, FL', 'Kissimmee, FL',
      'Clermont, FL', 'Apopka, FL', 'Sanford, FL',
      'Lake Mary, FL', 'Altamonte Springs, FL', 'Ocoee, FL',
      'Windermere, FL', 'Dr. Phillips, FL', 'Celebration, FL',
    ],
    services: [
      { name: 'Small Kitchen Remodel (10x10)', minPrice: 7500, maxPrice: 10000, currency: 'USD' },
      { name: 'Medium Kitchen Remodel (12x14)', minPrice: 10500, maxPrice: 14000, currency: 'USD' },
      { name: 'Large Kitchen Remodel (15x15+)', minPrice: 14500, maxPrice: 19000, currency: 'USD' },
      { name: 'Cabinet Installation Only', minPrice: 2800, maxPrice: 4000, currency: 'USD' },
    ],
    licenseInfo: 'Licensed and insured contractor in the state of Florida',
    totalCollections: 5,
    totalSkus: 1044,
  });
});

// ─────────────────────────────────────────────
// GET /api/public/collections
// All collections with metadata — AI readable
// ─────────────────────────────────────────────
router.get('/collections', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        styles: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = collections.map(c => ({
      id: c.id,
      name: c.name,
      totalProducts: c._count.products,
      styles: c.styles,
      availability: 'InStock',
    }));

    res.json({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Cabinet Collections',
      provider: 'Cabinets of Orlando',
      totalCollections: formatted.length,
      totalSkus: formatted.reduce((sum, c) => sum + c.totalProducts, 0),
      collections: formatted,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load collections' });
  }
});

// ─────────────────────────────────────────────
// GET /api/public/services
// Structured service + pricing data
// ─────────────────────────────────────────────
router.get('/services', (req, res) => {
  res.json({
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Cabinet Installation Services',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Cabinets of Orlando',
      telephone: '+18332017849',
    },
    services: [
      {
        '@type': 'Service',
        name: 'Small Kitchen Remodel',
        description: 'Complete cabinet installation for small kitchens up to 10x10 feet. Includes demo, haul-away, and installation.',
        kitchenSize: '10x10',
        minPrice: 7500,
        maxPrice: 10000,
        priceCurrency: 'USD',
        includes: ['Old cabinet removal', 'Haul-away', 'Full installation', 'Cleanup'],
        estimatedDuration: '1-2 days',
        availability: 'InStock',
      },
      {
        '@type': 'Service',
        name: 'Medium Kitchen Remodel',
        description: 'Complete cabinet installation for medium kitchens 12x14 feet.',
        kitchenSize: '12x14',
        minPrice: 10500,
        maxPrice: 14000,
        priceCurrency: 'USD',
        includes: ['Old cabinet removal', 'Haul-away', 'Full installation', 'Cleanup'],
        estimatedDuration: '2-3 days',
        availability: 'InStock',
      },
      {
        '@type': 'Service',
        name: 'Large Kitchen Remodel',
        description: 'Complete cabinet installation for large kitchens 15x15 feet or larger.',
        kitchenSize: '15x15+',
        minPrice: 14500,
        maxPrice: 19000,
        priceCurrency: 'USD',
        includes: ['Old cabinet removal', 'Haul-away', 'Full installation', 'Cleanup'],
        estimatedDuration: '3-5 days',
        availability: 'InStock',
      },
      {
        '@type': 'Service',
        name: 'Cabinet Installation Only',
        description: 'Professional installation service — customer supplies the cabinets.',
        kitchenSize: 'Any',
        minPrice: 2800,
        maxPrice: 4000,
        priceCurrency: 'USD',
        includes: ['Professional installation', 'Cleanup'],
        estimatedDuration: '1-3 days',
        availability: 'InStock',
      },
    ],
  });
});

// ─────────────────────────────────────────────
// POST /api/public/quote-request
// Public quote request — no auth required
// Creates customer + draft quote in DB
// ─────────────────────────────────────────────
router.post(
  '/quote-request',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('kitchenSize').trim().notEmpty().withMessage('Kitchen size is required'),
    body('collection').trim().notEmpty().withMessage('Collection preference is required'),
    body('timeline').trim().notEmpty().withMessage('Timeline is required'),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        firstName, lastName, email, phone,
        address, city, kitchenSize, collection,
        timeline, notes,
      } = req.body;

      // Upsert customer
      let customer = await prisma.customer.findFirst({
        where: { email },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            address: address || '',
            city: city || 'Orlando',
            state: 'FL',
            zipCode: '',
          },
        });
      }

      // Build notes string
      const quoteNotes = [
        `WEBSITE QUOTE REQUEST`,
        `Kitchen Size: ${kitchenSize}`,
        `Collection Preference: ${collection}`,
        `Timeline: ${timeline}`,
        notes ? `Additional Notes: ${notes}` : '',
        `Submitted: ${new Date().toISOString()}`,
        `Source: cabinetsoforlando.com/get-a-quote`,
      ].filter(Boolean).join('\n');

      // Get first available admin user to assign quote to
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      // Find matching collection (or fallback to first)
      let webCollection = await prisma.collection.findFirst({
        where: { name: { contains: collection, mode: 'insensitive' } },
        include: { styles: { take: 1 } },
      });

      if (!webCollection) {
        webCollection = await prisma.collection.findFirst({
          include: { styles: { take: 1 } },
        });
      }

      // Create draft quote if we have a collection with at least one style
      if (webCollection && adminUser && webCollection.styles.length > 0) {
        const quoteCount = await prisma.quote.count();
        const quoteNumber = `Q-${new Date().getFullYear()}-WEB-${String(quoteCount + 1).padStart(4, '0')}`;

        await prisma.quote.create({
          data: {
            quoteNumber,
            customerId: customer.id,
            userId: adminUser.id,
            collectionId: webCollection.id,
            styleId: webCollection.styles[0].id,
            status: 'DRAFT',
            notes: quoteNotes,
            subtotal: 0,
            clientCabinetPrice: 0,
            installationFee: 0,
            miscExpenses: 0,
            taxRate: 0.0875,
            taxAmount: 0,
            total: 0,
            msrpTotal: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      res.json({
        success: true,
        message: 'Quote request received. We will contact you within 2 business hours.',
        customer: {
          firstName,
          lastName,
          email,
        },
      });
    } catch (err) {
      console.error('Quote request error:', err);
      res.status(500).json({ error: 'Failed to submit quote request. Please call (833) 201-7849.' });
    }
  }
);

export default router;
