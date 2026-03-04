import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import prisma from '../utils/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { detectTenant } from '../middleware/tenant';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(detectTenant, authenticate, requireAdmin);

/**
 * POST /api/admin/catalog/import
 * Upload a CSV file to import/replace catalog products for the current business.
 *
 * Required CSV columns:
 *   collectionName, itemCode, description, category, msrp, price
 *
 * Optional CSV columns:
 *   width, height, depth, doors
 *
 * Behavior:
 *   - Collections are upserted (created if new, left alone if existing)
 *   - Products are upserted per (collectionId, itemCode) — updates price/description/category if changed
 *   - Returns { collectionsCreated, productsUpserted, errors[] }
 */
router.post('/import', upload.single('catalog'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded. Use field name "catalog".' });
  }

  const businessId: string = req.businessId;
  if (!businessId) {
    return res.status(400).json({ error: 'Could not resolve business for this request.' });
  }

  const csvText = req.file.buffer.toString('utf-8');

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return res.status(400).json({
      error: 'CSV parse errors',
      details: parsed.errors.slice(0, 10),
    });
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return res.status(400).json({ error: 'CSV file is empty or has no data rows.' });
  }

  // Validate required columns on first row
  const required = ['collectionName', 'itemCode', 'description', 'category', 'msrp', 'price'];
  const firstRow = rows[0];
  const missing = required.filter(col => !(col in firstRow));
  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required CSV columns: ${missing.join(', ')}`,
      hint: 'Required: collectionName, itemCode, description, category, msrp, price',
    });
  }

  // Group rows by collection name
  const collectionMap = new Map<string, typeof rows>();
  for (const row of rows) {
    const name = (row.collectionName || '').trim();
    if (!name) continue;
    if (!collectionMap.has(name)) collectionMap.set(name, []);
    collectionMap.get(name)!.push(row);
  }

  let collectionsCreated = 0;
  let productsUpserted = 0;
  const errors: string[] = [];

  for (const [collectionName, collectionRows] of collectionMap.entries()) {
    // Upsert collection
    let collection: { id: string };
    try {
      const existing = await prisma.collection.findUnique({
        where: { businessId_name: { businessId, name: collectionName } },
        select: { id: true },
      });

      if (existing) {
        collection = existing;
      } else {
        collection = await prisma.collection.create({
          data: { name: collectionName, businessId },
          select: { id: true },
        });
        collectionsCreated++;
      }
    } catch (err: any) {
      errors.push(`Collection "${collectionName}": ${err.message}`);
      continue;
    }

    // Upsert products for this collection
    for (const row of collectionRows) {
      const itemCode = (row.itemCode || '').trim();
      if (!itemCode) {
        errors.push(`Skipped row with empty itemCode in collection "${collectionName}"`);
        continue;
      }

      const msrp = parseFloat(row.msrp);
      const price = parseFloat(row.price);

      if (isNaN(msrp) || isNaN(price)) {
        errors.push(`Row ${itemCode}: msrp/price must be numbers (got "${row.msrp}", "${row.price}")`);
        continue;
      }

      const productData = {
        description: (row.description || '').trim(),
        category: (row.category || '').trim(),
        msrp,
        price,
        width: row.width ? parseInt(row.width) || null : null,
        height: row.height ? parseInt(row.height) || null : null,
        depth: row.depth ? parseInt(row.depth) || null : null,
        doors: (row.doors || '').trim() || null,
      };

      try {
        await prisma.product.upsert({
          where: { collectionId_itemCode: { collectionId: collection.id, itemCode } },
          create: { collectionId: collection.id, itemCode, ...productData },
          update: productData,
        });
        productsUpserted++;
      } catch (err: any) {
        errors.push(`Product "${itemCode}": ${err.message}`);
      }
    }
  }

  return res.json({
    success: true,
    collectionsCreated,
    productsUpserted,
    collectionsProcessed: collectionMap.size,
    rowsRead: rows.length,
    errors: errors.slice(0, 50), // cap error list for response size
  });
});

export default router;
