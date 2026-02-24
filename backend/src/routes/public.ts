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
      'Orlando, FL', 'Winter Park, FL', 'Apopka, FL', 'Ocoee, FL',
      'Clermont, FL', 'Kissimmee, FL', 'Pine Hills, FL',
      'Altamonte Springs, FL', 'MetroWest, FL', 'Winter Garden, FL', 'Lake Nona, FL',
    ],
    services: [
      { name: 'Kitchen Cabinet Installation', minPrice: 7500, maxPrice: 19000, currency: 'USD' },
      { name: 'Bathroom Cabinet Installation', minPrice: 1200, maxPrice: 4500, currency: 'USD' },
      { name: 'Countertop Installation', minPrice: 800, maxPrice: 3500, currency: 'USD' },
      { name: 'Install Only (IKEA, Home Depot, Lowes)', minPrice: 2800, maxPrice: 4000, currency: 'USD' },
    ],
    availability: '24/7 for calls and inquiries, installations Mon-Sat',
    licenseInfo: 'Licensed and insured contractor in the state of Florida',
    yearsInBusiness: 16,
    totalCollections: 5,
    totalSkus: 1044,
  });
});

// ─────────────────────────────────────────────
// GET /api/public/products
// Public product catalog — shows MSRP only (no cost data)
// Used by the self-service quote builder
// MARKUP_FACTOR applied to MSRP to get customer price
// ─────────────────────────────────────────────
const MARKUP_FACTOR = 1.2; // Customer pays 120% of MSRP

router.get('/products', async (req, res) => {
  try {
    const {
      collectionId,
      category,
      search,
      page = '1',
      limit = '48',
    } = req.query;

    const where: any = {};
    if (collectionId) where.collectionId = collectionId as string;
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { itemCode: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          itemCode: true,
          description: true,
          category: true,
          width: true,
          height: true,
          depth: true,
          msrp: true,
          collectionId: true,
          collection: { select: { name: true } },
        },
        orderBy: [{ category: 'asc' }, { itemCode: 'asc' }],
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map(p => ({
      id: p.id,
      itemCode: p.itemCode,
      description: p.description,
      category: p.category,
      width: p.width,
      height: p.height,
      depth: p.depth,
      msrp: Number(p.msrp),
      // Customer price = MSRP × markup factor
      customerPrice: Math.round(Number(p.msrp) * MARKUP_FACTOR * 100) / 100,
      collectionId: p.collectionId,
      collectionName: p.collection.name,
    }));

    res.json({
      products: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// ─────────────────────────────────────────────
// GET /api/public/categories
// Distinct categories for a collection
// ─────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const { collectionId } = req.query;
    const where: any = {};
    if (collectionId) where.collectionId = collectionId as string;

    const cats = await prisma.product.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json(cats.map(c => c.category));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
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
        items, // optional: [{productId, itemCode, description, qty, customerPrice}]
        quoteType, // 'estimate' | 'detailed'
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
      const itemsTotal = items?.reduce((sum: number, i: any) => sum + (i.customerPrice * i.qty), 0) ?? 0;
      const itemLines = items?.map((i: any) => `  - ${i.itemCode} x${i.qty}: $${(i.customerPrice * i.qty).toFixed(2)} (${i.description})`).join('\n') ?? '';

      const quoteNotes = [
        `WEBSITE QUOTE REQUEST (${quoteType === 'detailed' ? 'DETAILED BUILDER' : 'ESTIMATE'})`,
        `Kitchen Size: ${kitchenSize}`,
        `Collection Preference: ${collection}`,
        `Timeline: ${timeline}`,
        items?.length ? `\nSELECTED ITEMS (${items.length} products):\n${itemLines}\nItems Subtotal: $${itemsTotal.toFixed(2)}` : '',
        notes ? `\nAdditional Notes: ${notes}` : '',
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
