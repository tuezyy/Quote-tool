import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDims(desc: string) {
  const m = desc.match(/(\d+)"W x (\d+)"H x (\d+)"D/)
  return m ? { width: +m[1], height: +m[2], depth: +m[3] } : { width: null, height: null, depth: null }
}
function parseDoors(desc: string) {
  const m = desc.match(/(\d+D)/); return m ? m[1] : null
}

// products.json collection name → Milestone DB collection name(s)
const COLLECTION_MAP: Record<string, string[]> = {
  'Essential & Charm':         ['Essential Collection', 'Charm Collection'],
  'Classical & Double Shaker': ['Classic Style', 'Double Shaker'],
  'Slim Shaker':               ['Slim Shaker'],
  'Frameless High Gloss':      ['Frameless European'],
  'Builder Grade':             ['Builder Grade'],
}

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Business (Cabinets of Orlando) ─────────────────────────────────────────
  const business = await prisma.business.upsert({
    where:  { slug: 'cabinets-of-orlando' },
    update: {
      name:  'Cabinets of Orlando',
      phone: '(833) 201-7849',
      email: 'info@cabinetsoforlando.com',
      website: 'https://cabinetsoforlando.com',
      city:  'Orlando',
      state: 'FL',
      zip:   '32801',
      facebookUrl: 'https://www.facebook.com/cabinetsoforlando',
    },
    create: {
      slug:    'cabinets-of-orlando',
      name:    'Cabinets of Orlando',
      phone:   '(833) 201-7849',
      email:   'info@cabinetsoforlando.com',
      website: 'https://cabinetsoforlando.com',
      city:    'Orlando',
      state:   'FL',
      zip:     '32801',
      facebookUrl: 'https://www.facebook.com/cabinetsoforlando',
    },
  });
  console.log(`✅ Business: ${business.name} (${business.id})`);

  // ── Backfill existing rows with businessId ─────────────────────────────────
  const [usersUpdated, collectionsUpdated, customersUpdated, quotesUpdated, settingsUpdated] = await Promise.all([
    prisma.$executeRaw`UPDATE users SET business_id = ${business.id} WHERE business_id IS NULL`,
    prisma.$executeRaw`UPDATE collections SET business_id = ${business.id} WHERE business_id IS NULL`,
    prisma.$executeRaw`UPDATE customers SET business_id = ${business.id} WHERE business_id IS NULL`,
    prisma.$executeRaw`UPDATE quotes SET business_id = ${business.id} WHERE business_id IS NULL`,
    prisma.$executeRaw`UPDATE settings SET business_id = ${business.id} WHERE business_id IS NULL`,
  ]);
  console.log(`✅ Backfilled: ${usersUpdated} users, ${collectionsUpdated} collections, ${customersUpdated} customers, ${quotesUpdated} quotes, ${settingsUpdated} settings`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@cabinetquoting.com' },
    update: { businessId: business.id },
    create: { email: 'admin@cabinetquoting.com', passwordHash: adminHash, fullname: 'Admin User', role: 'ADMIN', businessId: business.id }
  });
  console.log(`✅ Admin user: ${admin.email}`);

  const installerHash = await bcrypt.hash('installer123', 10);
  const installer = await prisma.user.upsert({
    where:  { email: 'installer@cabinetquoting.com' },
    update: { businessId: business.id },
    create: { email: 'installer@cabinetquoting.com', passwordHash: installerHash, fullname: 'John Installer', role: 'INSTALLER', businessId: business.id }
  });
  console.log(`✅ Installer user: ${installer.email}`);

  // ── Settings ───────────────────────────────────────────────────────────────
  for (const s of [
    { key: 'tax_rate',        value: '0.0875' },
    { key: 'company_name',    value: 'Cabinets of Orlando' },
    { key: 'company_email',   value: 'info@cabinetsoforlando.com' },
    { key: 'company_phone',   value: '(833) 201-7849' },
    { key: 'company_address', value: 'Orlando, FL 32801' },
  ]) {
    await prisma.setting.upsert({
      where:  { businessId_key: { businessId: business.id, key: s.key } },
      update: {},
      create: { ...s, businessId: business.id }
    });
  }
  console.log('✅ Settings created');

  // ── Collections ────────────────────────────────────────────────────────────
  const collectionDefs = [
    { name: 'Essential Collection',  description: 'Classic shaker style in White, Gray & Espresso.',               imageUrl: '/images/styles/essential-shaker-white.jpg' },
    { name: 'Charm Collection',      description: 'Shaker style in 8 bold colors and wood tones.',                  imageUrl: '/images/styles/charm-rustic-wood.jpg' },
    { name: 'Slim Shaker',           description: 'Modern slim-rail shaker profile in 5 contemporary finishes.',    imageUrl: '/images/styles/slim-dove-white.jpg' },
    { name: 'Double Shaker',         description: 'Classic double-rail shaker door in Smokey Grey and Dove White.', imageUrl: '/images/styles/double-dove-white.jpg' },
    { name: 'Classic Style',         description: 'Traditional raised-panel doors in three timeless finishes.',     imageUrl: '/images/styles/classic-aspen-white.jpg' },
    { name: 'Frameless European',    description: 'Sleek European frameless — glass, gloss, matte, wood-look.',     imageUrl: '/images/styles/frameless-crystal-glass.jpg' },
    { name: 'Builder Grade',         description: 'Contractor-grade shaker in Floral White, Espresso and Gray.',    imageUrl: '/images/styles/builder-floral-white.jpg' },
  ];

  for (const col of collectionDefs) {
    await prisma.collection.upsert({
      where:  { businessId_name: { businessId: business.id, name: col.name } },
      update: { description: col.description, imageUrl: col.imageUrl },
      create: { ...col, businessId: business.id }
    });
  }
  console.log('✅ Collections created');

  // ── Styles ─────────────────────────────────────────────────────────────────
  const allCollections = await prisma.collection.findMany({ where: { businessId: business.id } });

  const stylesByCollection: Record<string, Array<{ code: string; name: string; description: string; imageUrl: string }>> = {
    'Essential Collection': [
      { code: 'SW',  name: 'Shaker White',       description: 'Bright, classic white shaker',           imageUrl: '/images/styles/essential-shaker-white.jpg' },
      { code: 'GR',  name: 'Shaker Gray',        description: 'Warm gray shaker finish',                imageUrl: '/images/styles/essential-shaker-gray.jpg' },
      { code: 'SE',  name: 'Shaker Espresso',    description: 'Rich espresso shaker finish',            imageUrl: '/images/styles/essential-shaker-espresso.jpg' },
    ],
    'Charm Collection': [
      { code: 'NB',  name: 'Navy Blue',          description: 'Deep navy shaker',                       imageUrl: '/images/styles/charm-navy-blue.jpg' },
      { code: 'IB',  name: 'Iron Black',         description: 'Matte iron black shaker',                imageUrl: '/images/styles/charm-iron-black.jpg' },
      { code: 'TC',  name: 'Treasure Chest',     description: 'Warm brown wood-tone shaker',            imageUrl: '/images/styles/charm-treasure-chest.jpg' },
      { code: 'AG',  name: 'Aston Green',        description: 'Earthy sage-green shaker',               imageUrl: '/images/styles/charm-aston-green.jpg' },
      { code: 'SA',  name: 'Smokey Ash',         description: 'Cool smokey ash shaker',                 imageUrl: '/images/styles/charm-smokey-ash.jpg' },
      { code: 'LG',  name: 'Luna Grey',          description: 'Soft luna grey shaker',                  imageUrl: '/images/styles/charm-luna-grey.jpg' },
      { code: 'RW',  name: 'Rustic Wood',        description: 'Warm rustic wood-grain shaker',          imageUrl: '/images/styles/charm-rustic-wood.jpg' },
      { code: 'SB',  name: 'Sage Breeze',        description: 'Light sage green shaker',                imageUrl: '/images/styles/charm-sage-breeze.jpg' },
    ],
    'Slim Shaker': [
      { code: 'SDW', name: 'Slim Dove White',    description: 'Slim rail dove white',                   imageUrl: '/images/styles/slim-dove-white.jpg' },
      { code: 'SWO', name: 'Slim White Oak',     description: 'Slim rail white oak wood-look',          imageUrl: '/images/styles/slim-white-oak.jpg' },
      { code: 'SAG', name: 'Slim Aston Green',   description: 'Slim rail aston green',                  imageUrl: '/images/styles/slim-aston-green.jpg' },
      { code: 'SAO', name: 'Slim Amber Oak',     description: 'Slim rail warm amber oak',               imageUrl: '/images/styles/slim-amber-oak.jpg' },
      { code: 'SIB', name: 'Slim Iron Black',    description: 'Slim rail matte iron black',             imageUrl: '/images/styles/slim-iron-black.jpg' },
    ],
    'Double Shaker': [
      { code: 'DSG', name: 'Double Smokey Grey', description: 'Double shaker smokey grey',              imageUrl: '/images/styles/double-smokey-grey.jpg' },
      { code: 'DDW', name: 'Double Dove White',  description: 'Double shaker dove white',               imageUrl: '/images/styles/double-dove-white.jpg' },
    ],
    'Classic Style': [
      { code: 'CW',  name: 'Charleston White',     description: 'Classic Charleston white raised panel',  imageUrl: '/images/styles/classic-charleston-white.jpg' },
      { code: 'AW',  name: 'Aspen White',          description: 'Traditional Aspen white raised panel',   imageUrl: '/images/styles/classic-aspen-white.jpg' },
      { code: 'AC',  name: 'Aspen Charcoal Gray',  description: 'Elegant charcoal gray raised panel',     imageUrl: '/images/styles/classic-aspen-charcoal-gray.jpg' },
    ],
    'Frameless European': [
      { code: 'HW',  name: 'High Gloss White',   description: 'High gloss white frameless',             imageUrl: '/images/styles/frameless-high-gloss-white.jpg' },
      { code: 'HG',  name: 'High Gloss Gray',    description: 'High gloss gray frameless',              imageUrl: '/images/styles/frameless-high-gloss-gray.jpg' },
      { code: 'CG',  name: 'Crystal Glass',      description: 'Frosted crystal glass frameless',        imageUrl: '/images/styles/frameless-crystal-glass.jpg' },
      { code: 'MG',  name: 'Midnight Glass',     description: 'Dark tinted midnight glass',             imageUrl: '/images/styles/frameless-midnight-glass.jpg' },
      { code: 'MB',  name: 'Matt Black',         description: 'Matte black flat-panel frameless',       imageUrl: '/images/styles/frameless-matt-black.jpg' },
      { code: 'MI',  name: 'Matt Ivory',         description: 'Matte ivory flat-panel frameless',       imageUrl: '/images/styles/frameless-matt-ivory.jpg' },
      { code: 'OB',  name: 'Oak Blonde',         description: 'Light blonde oak wood-look',             imageUrl: '/images/styles/frameless-oak-blonde.jpg' },
      { code: 'OS',  name: 'Oak Shade',          description: 'Mid-tone shaded oak wood-look',          imageUrl: '/images/styles/frameless-oak-shade.jpg' },
    ],
    'Builder Grade': [
      { code: 'FW',  name: 'Floral White',       description: 'Clean white builder-grade shaker',       imageUrl: '/images/styles/builder-floral-white.jpg' },
      { code: 'FE',  name: 'Floral Espresso',    description: 'Espresso builder-grade shaker',          imageUrl: '/images/styles/builder-floral-espresso.jpg' },
      { code: 'FG',  name: 'Floral Gray',        description: 'Gray builder-grade shaker',              imageUrl: '/images/styles/builder-floral-gray.jpg' },
    ],
  };

  for (const collection of allCollections) {
    for (const style of (stylesByCollection[collection.name] || [])) {
      await prisma.style.upsert({
        where:  { collectionId_code: { collectionId: collection.id, code: style.code } },
        update: { name: style.name, description: style.description, imageUrl: style.imageUrl },
        create: { collectionId: collection.id, ...style }
      });
    }
  }
  console.log('✅ Styles created for all collections');

  // ── Products (real data from Google Sheet export) ──────────────────────────
  console.log('Importing products from catalog data...');

  // prisma/seed.ts lives in /prisma/, products.json is in /src/data/
  const dataPath = path.join(__dirname, '../src/data/products.json')
  const productData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  let totalImported = 0

  for (const colData of productData.collections) {
    const targetNames = COLLECTION_MAP[colData.name]
    if (!targetNames) { console.log(`  ⚠️  No mapping for: ${colData.name}`); continue }

    for (const targetName of targetNames) {
      const col = allCollections.find(c => c.name === targetName)
      if (!col) { console.log(`  ⚠️  Collection not in DB: ${targetName}`); continue }

      let count = 0
      for (const p of colData.products) {
        const dims = parseDims(p.description)
        await prisma.product.upsert({
          where:  { collectionId_itemCode: { collectionId: col.id, itemCode: p.item_code } },
          update: { description: p.description, category: p.category, ...dims, msrp: p.msrp, price: p.your_price },
          create: { collectionId: col.id, itemCode: p.item_code, description: p.description, category: p.category, ...dims, doors: parseDoors(p.description), msrp: p.msrp, price: p.your_price }
        })
        count++
      }
      totalImported += count
      console.log(`  ✅ ${count} products → ${targetName}`)
    }
  }
  console.log(`✅ ${totalImported} real products imported (MSRP + warehouse price from catalog)`);

  // ── Sample customer ────────────────────────────────────────────────────────
  await prisma.customer.upsert({
    where:  { businessId_email: { businessId: business.id, email: 'johndoe@example.com' } },
    update: {},
    create: { firstName: 'John', lastName: 'Doe', email: 'johndoe@example.com', phone: '(555) 987-6543', address: '123 Main Street', city: 'Orlando', state: 'FL', zipCode: '32801', businessId: business.id }
  });
  console.log('✅ Sample customer created');

  console.log('\n✨ Seed completed!');
  console.log('  Business:  Cabinets of Orlando (' + business.slug + ')');
  console.log('  Admin:     admin@cabinetquoting.com / admin123');
  console.log('  Installer: installer@cabinetquoting.com / installer123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
