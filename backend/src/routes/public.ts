import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { sendCustomerOpener, sendInstallerNotification } from '../services/sms';

const router = Router();

// ─────────────────────────────────────────────
// Smart estimate — BOM templates
// Customer price = MSRP × 0.8 (warehouse cost is 40% MSRP)
// ─────────────────────────────────────────────
const CUSTOMER_MARKUP = 0.8;

interface BomItem { code: string; qty: number }
interface BomTemplate { base: BomItem[]; wall: BomItem[]; installFee: number }

const BOM: Record<string, BomTemplate> = {
  straight_small: {
    base: [{ code:'B18',qty:1 },{ code:'B24',qty:1 },{ code:'B30',qty:1 },{ code:'SB30',qty:1 }],
    wall: [{ code:'W1830',qty:1 },{ code:'W2430',qty:1 },{ code:'W3030',qty:1 },{ code:'W3630',qty:1 }],
    installFee: 1800,
  },
  straight_medium: {
    base: [{ code:'B18',qty:1 },{ code:'B21',qty:1 },{ code:'B24',qty:1 },{ code:'SB30',qty:1 },{ code:'B30',qty:1 },{ code:'B33',qty:1 }],
    wall: [{ code:'W1830',qty:1 },{ code:'W2130',qty:1 },{ code:'W2430',qty:1 },{ code:'W3030',qty:2 },{ code:'W3330',qty:1 }],
    installFee: 2500,
  },
  straight_large: {
    base: [{ code:'B18',qty:1 },{ code:'B21',qty:1 },{ code:'B24',qty:2 },{ code:'SB33',qty:1 },{ code:'B30',qty:2 },{ code:'B36',qty:1 }],
    wall: [{ code:'W1830',qty:1 },{ code:'W2130',qty:1 },{ code:'W2430',qty:2 },{ code:'W3030',qty:2 },{ code:'W3330',qty:1 },{ code:'W3630',qty:1 }],
    installFee: 3200,
  },
  l_shape_small: {
    base: [{ code:'BBC36',qty:1 },{ code:'B18',qty:1 },{ code:'B24',qty:1 },{ code:'SB30',qty:1 },{ code:'B30',qty:1 },{ code:'B24',qty:1 }],
    wall: [{ code:'WBC3630',qty:1 },{ code:'W1830',qty:1 },{ code:'W2430',qty:2 },{ code:'W3030',qty:1 },{ code:'W3630',qty:1 }],
    installFee: 2400,
  },
  l_shape_medium: {
    base: [{ code:'BBC36',qty:1 },{ code:'B18',qty:2 },{ code:'B24',qty:2 },{ code:'SB30',qty:1 },{ code:'B30',qty:2 }],
    wall: [{ code:'WBC3630',qty:1 },{ code:'W1830',qty:2 },{ code:'W2430',qty:2 },{ code:'W3030',qty:2 },{ code:'W3630',qty:1 }],
    installFee: 3200,
  },
  l_shape_large: {
    base: [{ code:'BBC36',qty:1 },{ code:'B18',qty:2 },{ code:'B21',qty:1 },{ code:'B24',qty:2 },{ code:'SB33',qty:1 },{ code:'B30',qty:2 },{ code:'B33',qty:1 },{ code:'B36',qty:1 }],
    wall: [{ code:'WBC3630',qty:1 },{ code:'W1830',qty:2 },{ code:'W2130',qty:1 },{ code:'W2430',qty:2 },{ code:'W3030',qty:2 },{ code:'W3330',qty:1 },{ code:'W3630',qty:1 }],
    installFee: 4000,
  },
  u_shape_small: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B24',qty:1 },{ code:'SB30',qty:1 },{ code:'B24',qty:1 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2430',qty:1 },{ code:'W3030',qty:1 },{ code:'W2430',qty:1 }],
    installFee: 3000,
  },
  u_shape_medium: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B24',qty:2 },{ code:'SB30',qty:1 },{ code:'B30',qty:1 },{ code:'B24',qty:1 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2430',qty:2 },{ code:'W3030',qty:1 },{ code:'W3630',qty:1 },{ code:'W2430',qty:1 }],
    installFee: 3800,
  },
  u_shape_large: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B21',qty:1 },{ code:'B24',qty:2 },{ code:'SB33',qty:1 },{ code:'B30',qty:2 },{ code:'B33',qty:1 },{ code:'B21',qty:1 },{ code:'B24',qty:1 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2130',qty:1 },{ code:'W2430',qty:2 },{ code:'W3030',qty:2 },{ code:'W3330',qty:1 },{ code:'W2430',qty:1 },{ code:'W3030',qty:1 }],
    installFee: 4800,
  },
  island_small: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B24',qty:1 },{ code:'SB30',qty:1 },{ code:'B24',qty:1 },{ code:'B30',qty:2 },{ code:'B21',qty:2 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2430',qty:1 },{ code:'W3030',qty:1 },{ code:'W2430',qty:1 }],
    installFee: 3500,
  },
  island_medium: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B24',qty:2 },{ code:'SB30',qty:1 },{ code:'B30',qty:1 },{ code:'B24',qty:1 },{ code:'B21',qty:2 },{ code:'B24',qty:2 },{ code:'B30',qty:1 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2430',qty:2 },{ code:'W3030',qty:1 },{ code:'W3630',qty:1 },{ code:'W2430',qty:1 }],
    installFee: 4500,
  },
  island_large: {
    base: [{ code:'BBC36',qty:2 },{ code:'B18',qty:2 },{ code:'B21',qty:1 },{ code:'B24',qty:2 },{ code:'SB33',qty:1 },{ code:'B30',qty:2 },{ code:'B33',qty:1 },{ code:'B21',qty:1 },{ code:'B24',qty:1 },{ code:'B24',qty:2 },{ code:'B30',qty:2 },{ code:'B21',qty:2 }],
    wall: [{ code:'WBC3630',qty:2 },{ code:'W1830',qty:2 },{ code:'W2130',qty:1 },{ code:'W2430',qty:2 },{ code:'W3030',qty:2 },{ code:'W3330',qty:1 },{ code:'W2430',qty:1 },{ code:'W3030',qty:1 }],
    installFee: 5500,
  },
};

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
        estimateMin, estimateMax, // frontend-calculated estimate range
        style, // selected door style
        // Lead qualification
        ownsHome,         // boolean | undefined
        replacingAll,     // boolean | undefined (true=yes, undefined=not sure)
        customerTimeline, // '0-3' | '3-6' | 'exploring' | undefined
        isQualified,      // boolean
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
        style ? `Door Style: ${style}` : '',
        estimateMin && estimateMax ? `Estimate Range: $${estimateMin.toLocaleString()}–$${estimateMax.toLocaleString()}` : '',
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
      let quoteNumber = '';
      let quote: { id: string } | null = null;

      // Pick installer from DB (first available with a phone), fall back to env var
      const installerUser = await prisma.user.findFirst({
        where: { role: 'INSTALLER', isAvailable: true, phone: { not: null } },
        orderBy: { createdAt: 'asc' },
      });
      const installerPhone = installerUser?.phone || process.env.INSTALLER_PHONE || '';

      if (webCollection && adminUser && webCollection.styles.length > 0) {
        const quoteCount = await prisma.quote.count();
        quoteNumber = `Q-${new Date().getFullYear()}-WEB-${String(quoteCount + 1).padStart(4, '0')}`;

        quote = await prisma.quote.create({
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
            installerPhone: installerPhone || null,
            // Lead qualification
            ownsHome:         ownsHome ?? null,
            replacingAll:     replacingAll ?? null,
            customerTimeline: customerTimeline || null,
            isQualified:      isQualified === true,
          },
        });
      }

      // Trigger Vapi outbound call (Emma) — skip for renters (hard disqualified)
      if (quoteNumber && quote && ownsHome !== false) {
        const { triggerOutboundCall } = await import('../services/vapi');
        triggerOutboundCall(phone, `${firstName} ${lastName}`, quoteNumber, quote.id)
          .then(() => console.log(`[Vapi] Outbound call triggered for ${quoteNumber}`))
          .catch(err => console.error('[Vapi] Call trigger failed:', err.message));
      } else if (ownsHome === false) {
        console.log(`[Vapi] Skipped Emma call for ${quoteNumber} — renter`);
      }

      // Fire SMS notifications (non-blocking — don't let SMS failure break the response)
      if (quoteNumber) {
        const customerName = `${firstName} ${lastName}`;

        Promise.all([
          sendCustomerOpener(firstName, phone, quoteNumber).catch(
            (e) => console.error('[SMS] Customer opener failed:', e.message)
          ),
          installerPhone
            ? sendInstallerNotification(
                installerPhone,
                customerName,
                phone,
                kitchenSize,
                collection,
                quoteNumber
              ).catch((e) => console.error('[SMS] Installer notification failed:', e.message))
            : Promise.resolve(),
        ]);
      }

      res.json({
        success: true,
        message: 'Quote request received. We will contact you within 2 business hours.',
        quoteNumber: quoteNumber || null,
        customer: { firstName, lastName, email },
      });
    } catch (err) {
      console.error('Quote request error:', err);
      res.status(500).json({ error: 'Failed to submit quote request. Please call (833) 201-7849.' });
    }
  }
);

// ─────────────────────────────────────────────
// Template linear footage reference (median per size bucket)
// Used to scale installFee when actual wall dimensions are provided
// ─────────────────────────────────────────────
const TEMPLATE_LF: Record<string, number> = {
  straight_small: 10, straight_medium: 13, straight_large: 16,
  l_shape_small:  19, l_shape_medium:  22, l_shape_large:  26,
  u_shape_small:  26, u_shape_medium:  30, u_shape_large:  36,
  island_small:   34, island_medium:   40, island_large:   48,
};

function wallsToLF(layout: string, walls: { a?: number; b?: number; c?: number; island?: number }): number | null {
  const a = Number(walls.a) || 0;
  const b = Number(walls.b) || 0;
  const c = Number(walls.c) || 0;
  const island = Number(walls.island) || 0;
  switch (layout) {
    case 'straight': return a > 0 ? a : null;
    case 'l_shape':  return (a > 0 && b > 0) ? a + b : null;
    case 'u_shape':  return (a > 0 && b > 0 && c > 0) ? a + b + c : null;
    case 'island':   return (a > 0 && b > 0) ? a + b + c + island : null;
    default:         return null;
  }
}

function lfToSize(layout: string, lf: number): string {
  switch (layout) {
    case 'straight': return lf < 12 ? 'small' : lf <= 16 ? 'medium' : 'large';
    case 'l_shape':  return lf < 19 ? 'small' : lf <= 24 ? 'medium' : 'large';
    case 'u_shape':  return lf < 27 ? 'small' : lf <= 32 ? 'medium' : 'large';
    case 'island':   return lf < 35 ? 'small' : lf <= 42 ? 'medium' : 'large';
    default:         return 'medium';
  }
}

// ─────────────────────────────────────────────
// GET /api/public/smart-estimate
// Returns a real-data cabinet estimate using actual product MSRPs from the DB
// Query params: layout, size, collection, replacing (true/false)
// Optional: walls (JSON string e.g. '{"a":12,"b":9}') — more accurate when provided
// ─────────────────────────────────────────────
router.get('/smart-estimate', async (req: any, res: any) => {
  try {
    const { layout, size, collection, replacing, walls: wallsParam } = req.query;

    if (!layout) {
      return res.status(400).json({ error: 'layout is required' });
    }

    // Install-only shortcut
    if (layout === 'install_only' || size === 'install_only') {
      return res.json({ min: 2800, max: 4000, cabinetCount: 0, installFee: 3400, demoFee: 0, cabinetPrice: 0 });
    }

    // Parse optional walls param and derive actual LF + override size
    let actualLF: number | null = null;
    let derivedSize = size as string;

    if (wallsParam) {
      try {
        const walls = JSON.parse(wallsParam as string);
        actualLF = wallsToLF(layout as string, walls);
        if (actualLF !== null) {
          derivedSize = lfToSize(layout as string, actualLF);
        }
      } catch {
        // ignore bad walls JSON — fall back to size param
      }
    }

    if (!derivedSize) {
      return res.status(400).json({ error: 'size or walls param required' });
    }

    const bomKey = `${layout}_${derivedSize}`;
    const template = BOM[bomKey];
    if (!template) {
      return res.status(400).json({ error: `Unknown layout/size: ${bomKey}` });
    }

    // Find collection in DB (or use any collection as a price reference)
    let collectionId: string | null = null;
    if (collection && collection !== 'Not Sure Yet') {
      const dbCol = await prisma.collection.findFirst({
        where: { name: { contains: collection as string, mode: 'insensitive' } },
        select: { id: true },
      });
      collectionId = dbCol?.id ?? null;
    }

    // Fallback to Essential Collection if not found
    if (!collectionId) {
      const fallback = await prisma.collection.findFirst({
        where: { name: { contains: 'Essential', mode: 'insensitive' } },
        select: { id: true },
      });
      collectionId = fallback?.id ?? null;
    }

    if (!collectionId) {
      return res.status(500).json({ error: 'No product collection found in database' });
    }

    // Collect all item codes from template
    const allItems = [...template.base, ...template.wall];
    const uniqueCodes = [...new Set(allItems.map(i => i.code))];

    // Query those product codes in the selected collection
    const products = await prisma.product.findMany({
      where: { collectionId, itemCode: { in: uniqueCodes } },
      select: { itemCode: true, msrp: true },
    });

    const priceMap: Record<string, number> = {};
    for (const p of products) {
      priceMap[p.itemCode] = Number(p.msrp);
    }

    // For any missing codes, fall back to category averages
    const missingCodes = uniqueCodes.filter(c => !priceMap[c]);
    if (missingCodes.length > 0) {
      const [baseAvg, wallAvg] = await Promise.all([
        prisma.product.aggregate({
          where: { collectionId, category: { contains: 'BASE', mode: 'insensitive' } },
          _avg: { msrp: true },
        }),
        prisma.product.aggregate({
          where: { collectionId, category: { contains: 'WALL', mode: 'insensitive' } },
          _avg: { msrp: true },
        }),
      ]);

      const avgBase = Number(baseAvg._avg.msrp) || 520;
      const avgWall = Number(wallAvg._avg.msrp) || 370;

      for (const code of missingCodes) {
        const isWall = code.startsWith('W') || code.startsWith('WBC');
        priceMap[code] = isWall ? avgWall : avgBase;
      }
    }

    // Sum total MSRP weighted by qty
    let totalMsrp = 0;
    let cabinetCount = 0;
    for (const item of allItems) {
      totalMsrp += (priceMap[item.code] || 0) * item.qty;
      cabinetCount += item.qty;
    }

    // Customer price = MSRP × 0.8 markup
    const cabinetPrice = Math.round(totalMsrp * CUSTOMER_MARKUP);

    // Scale installFee by actual LF vs template LF for more precise labor cost
    const templateLF = TEMPLATE_LF[bomKey] || 1;
    const scaleFactor = (actualLF && actualLF > 0) ? actualLF / templateLF : 1;
    const installFee = Math.round(template.installFee * scaleFactor / 50) * 50; // round to $50

    const demoFee = replacing === 'true' ? Math.round(installFee * 0.28) : 0;
    const taxAmount = Math.round(cabinetPrice * 0.0875); // FL tax on materials only
    const total = cabinetPrice + installFee + demoFee + taxAmount;

    // Return a ±10% range (kitchen dimensions always vary slightly)
    res.json({
      min: Math.round(total * 0.92 / 100) * 100,
      max: Math.round(total * 1.10 / 100) * 100,
      base: Math.round(total / 100) * 100,
      cabinetCount,
      cabinetMsrp: Math.round(totalMsrp),
      cabinetPrice,
      installFee,
      demoFee,
      taxAmount,
    });
  } catch (err) {
    console.error('[SmartEstimate] error:', err);
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

export default router;
