import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  console.log('Creating default admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cabinetquoting.com' },
    update: {},
    create: {
      email: 'admin@cabinetquoting.com',
      passwordHash: adminPasswordHash,
      fullname: 'Admin User',
      role: 'ADMIN'
    }
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create default installer user
  console.log('Creating default installer user...');
  const installerPasswordHash = await bcrypt.hash('installer123', 10);

  const installer = await prisma.user.upsert({
    where: { email: 'installer@cabinetquoting.com' },
    update: {},
    create: {
      email: 'installer@cabinetquoting.com',
      passwordHash: installerPasswordHash,
      fullname: 'John Installer',
      role: 'INSTALLER'
    }
  });
  console.log(`✅ Installer user created: ${installer.email}`);

  // Create default settings
  console.log('Creating default settings...');

  const settingsToCreate = [
    { key: 'tax_rate', value: '0.0875' },
    { key: 'company_name', value: 'Cabinet Quoting & Installation Co.' },
    { key: 'company_email', value: 'info@cabinetquoting.com' },
    { key: 'company_phone', value: '(555) 123-4567' },
    { key: 'company_address', value: '' }
  ];

  for (const setting of settingsToCreate) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }

  console.log('✅ Default settings created');

  // Create collections — matches real Milestone Cabinetry catalog
  console.log('Creating collections...');

  const collections = [
    { name: 'Essential Collection',   description: 'Classic shaker style in White, Gray & Espresso. Clean lines, solid construction.',        imageUrl: '/images/styles/essential-shaker-white.jpg' },
    { name: 'Charm Collection',       description: 'Shaker style in 8 bold colors and wood tones. The most versatile collection.',            imageUrl: '/images/styles/charm-rustic-wood.jpg' },
    { name: 'Slim Shaker',            description: 'Modern slim-rail shaker profile in 5 contemporary finishes.',                             imageUrl: '/images/styles/slim-dove-white.jpg' },
    { name: 'Double Shaker',          description: 'Classic double-rail shaker door in Smokey Grey and Dove White.',                          imageUrl: '/images/styles/double-dove-white.jpg' },
    { name: 'Classic Style',          description: 'Traditional raised-panel doors in Charleston White, Aspen White and Aspen Charcoal Gray.', imageUrl: '/images/styles/classic-aspen-white.jpg' },
    { name: 'Frameless European',     description: 'Sleek European frameless construction — glass, gloss, matte and wood-look finishes.',      imageUrl: '/images/styles/frameless-crystal-glass.jpg' },
    { name: 'Builder Grade',          description: 'Contractor-grade shaker in Floral White, Espresso and Gray. Best price point.',           imageUrl: '/images/styles/builder-floral-white.jpg' },
  ];

  for (const col of collections) {
    await prisma.collection.upsert({
      where:  { name: col.name },
      update: { description: col.description, imageUrl: col.imageUrl },
      create: col
    });
  }

  console.log('✅ Collections created');

  // Create styles — every door style from Milestone catalog with image URLs
  const allCollections = await prisma.collection.findMany();

  const stylesByCollection: Record<string, Array<{ code: string; name: string; description: string; imageUrl: string }>> = {
    'Essential Collection': [
      { code: 'SW',  name: 'Shaker White',   description: 'Bright, classic white shaker',   imageUrl: '/images/styles/essential-shaker-white.jpg' },
      { code: 'GR',  name: 'Shaker Gray',    description: 'Warm gray shaker finish',         imageUrl: '/images/styles/essential-shaker-gray.jpg' },
      { code: 'SE',  name: 'Shaker Espresso',description: 'Rich espresso shaker finish',     imageUrl: '/images/styles/essential-shaker-espresso.jpg' },
    ],
    'Charm Collection': [
      { code: 'NB',  name: 'Navy Blue',      description: 'Deep navy shaker',                imageUrl: '/images/styles/charm-navy-blue.jpg' },
      { code: 'IB',  name: 'Iron Black',     description: 'Matte iron black shaker',         imageUrl: '/images/styles/charm-iron-black.jpg' },
      { code: 'TC',  name: 'Treasure Chest', description: 'Warm brown wood-tone shaker',     imageUrl: '/images/styles/charm-treasure-chest.jpg' },
      { code: 'AG',  name: 'Aston Green',    description: 'Earthy sage-green shaker',        imageUrl: '/images/styles/charm-aston-green.jpg' },
      { code: 'SA',  name: 'Smokey Ash',     description: 'Cool smokey ash shaker',          imageUrl: '/images/styles/charm-smokey-ash.jpg' },
      { code: 'LG',  name: 'Luna Grey',      description: 'Soft luna grey shaker',           imageUrl: '/images/styles/charm-luna-grey.jpg' },
      { code: 'RW',  name: 'Rustic Wood',    description: 'Warm rustic wood-grain shaker',   imageUrl: '/images/styles/charm-rustic-wood.jpg' },
      { code: 'SB',  name: 'Sage Breeze',    description: 'Light sage green shaker',         imageUrl: '/images/styles/charm-sage-breeze.jpg' },
    ],
    'Slim Shaker': [
      { code: 'SDW', name: 'Slim Dove White', description: 'Slim rail dove white',           imageUrl: '/images/styles/slim-dove-white.jpg' },
      { code: 'SWO', name: 'Slim White Oak',  description: 'Slim rail white oak wood-look',  imageUrl: '/images/styles/slim-white-oak.jpg' },
      { code: 'SAG', name: 'Slim Aston Green',description: 'Slim rail aston green',          imageUrl: '/images/styles/slim-aston-green.jpg' },
      { code: 'SAO', name: 'Slim Amber Oak',  description: 'Slim rail warm amber oak',       imageUrl: '/images/styles/slim-amber-oak.jpg' },
      { code: 'SIB', name: 'Slim Iron Black', description: 'Slim rail matte iron black',     imageUrl: '/images/styles/slim-iron-black.jpg' },
    ],
    'Double Shaker': [
      { code: 'DSG', name: 'Double Smokey Grey', description: 'Double shaker smokey grey',   imageUrl: '/images/styles/double-smokey-grey.jpg' },
      { code: 'DDW', name: 'Double Dove White',  description: 'Double shaker dove white',    imageUrl: '/images/styles/double-dove-white.jpg' },
    ],
    'Classic Style': [
      { code: 'CW',  name: 'Charleston White',      description: 'Classic Charleston white raised panel',     imageUrl: '/images/styles/classic-charleston-white.jpg' },
      { code: 'AW',  name: 'Aspen White',            description: 'Traditional Aspen white raised panel',      imageUrl: '/images/styles/classic-aspen-white.jpg' },
      { code: 'AC',  name: 'Aspen Charcoal Gray',    description: 'Elegant charcoal gray raised panel',        imageUrl: '/images/styles/classic-aspen-charcoal-gray.jpg' },
    ],
    'Frameless European': [
      { code: 'HW',  name: 'High Gloss White',   description: 'High gloss white frameless',       imageUrl: '/images/styles/frameless-high-gloss-white.jpg' },
      { code: 'HG',  name: 'High Gloss Gray',    description: 'High gloss gray frameless',         imageUrl: '/images/styles/frameless-high-gloss-gray.jpg' },
      { code: 'CG',  name: 'Crystal Glass',      description: 'Frosted crystal glass frameless',   imageUrl: '/images/styles/frameless-crystal-glass.jpg' },
      { code: 'MG',  name: 'Midnight Glass',     description: 'Dark tinted midnight glass',         imageUrl: '/images/styles/frameless-midnight-glass.jpg' },
      { code: 'MB',  name: 'Matt Black',         description: 'Matte black flat-panel frameless',   imageUrl: '/images/styles/frameless-matt-black.jpg' },
      { code: 'MI',  name: 'Matt Ivory',         description: 'Matte ivory flat-panel frameless',   imageUrl: '/images/styles/frameless-matt-ivory.jpg' },
      { code: 'OB',  name: 'Oak Blonde',         description: 'Light blonde oak wood-look',         imageUrl: '/images/styles/frameless-oak-blonde.jpg' },
      { code: 'OS',  name: 'Oak Shade',          description: 'Mid-tone shaded oak wood-look',      imageUrl: '/images/styles/frameless-oak-shade.jpg' },
    ],
    'Builder Grade': [
      { code: 'FW',  name: 'Floral White',    description: 'Clean white builder-grade shaker',    imageUrl: '/images/styles/builder-floral-white.jpg' },
      { code: 'FE',  name: 'Floral Espresso', description: 'Espresso builder-grade shaker',        imageUrl: '/images/styles/builder-floral-espresso.jpg' },
      { code: 'FG',  name: 'Floral Gray',     description: 'Gray builder-grade shaker',            imageUrl: '/images/styles/builder-floral-gray.jpg' },
    ],
  };

  for (const collection of allCollections) {
    const styles = stylesByCollection[collection.name] || [];
    for (const style of styles) {
      await prisma.style.upsert({
        where:  { collectionId_code: { collectionId: collection.id, code: style.code } },
        update: { name: style.name, description: style.description, imageUrl: style.imageUrl },
        create: { collectionId: collection.id, ...style }
      });
    }
  }

  console.log('✅ Styles created for all collections');

  // Create sample products for all collections
  console.log('Creating sample products...');

  // Base cabinet products (common across collections)
  const baseProducts = [
    // Base Cabinets
    { itemCode: 'B12', description: 'Base Cabinet 12"', category: 'Base Cabinets', width: 12, height: 34, depth: 24, msrp: 285, price: 199 },
    { itemCode: 'B15', description: 'Base Cabinet 15"', category: 'Base Cabinets', width: 15, height: 34, depth: 24, msrp: 315, price: 220 },
    { itemCode: 'B18', description: 'Base Cabinet 18"', category: 'Base Cabinets', width: 18, height: 34, depth: 24, msrp: 345, price: 241 },
    { itemCode: 'B21', description: 'Base Cabinet 21"', category: 'Base Cabinets', width: 21, height: 34, depth: 24, msrp: 375, price: 262 },
    { itemCode: 'B24', description: 'Base Cabinet 24"', category: 'Base Cabinets', width: 24, height: 34, depth: 24, msrp: 405, price: 283 },
    { itemCode: 'B27', description: 'Base Cabinet 27"', category: 'Base Cabinets', width: 27, height: 34, depth: 24, msrp: 445, price: 311 },
    { itemCode: 'B30', description: 'Base Cabinet 30"', category: 'Base Cabinets', width: 30, height: 34, depth: 24, msrp: 485, price: 339 },
    { itemCode: 'B33', description: 'Base Cabinet 33"', category: 'Base Cabinets', width: 33, height: 34, depth: 24, msrp: 525, price: 367 },
    { itemCode: 'B36', description: 'Base Cabinet 36"', category: 'Base Cabinets', width: 36, height: 34, depth: 24, msrp: 565, price: 395 },
    { itemCode: 'SB30', description: 'Sink Base Cabinet 30"', category: 'Base Cabinets', width: 30, height: 34, depth: 24, msrp: 425, price: 297 },
    { itemCode: 'SB33', description: 'Sink Base Cabinet 33"', category: 'Base Cabinets', width: 33, height: 34, depth: 24, msrp: 455, price: 318 },
    { itemCode: 'SB36', description: 'Sink Base Cabinet 36"', category: 'Base Cabinets', width: 36, height: 34, depth: 24, msrp: 495, price: 346 },
    { itemCode: 'DB12', description: 'Drawer Base 12" (3 Drawer)', category: 'Base Cabinets', width: 12, height: 34, depth: 24, msrp: 385, price: 269 },
    { itemCode: 'DB15', description: 'Drawer Base 15" (3 Drawer)', category: 'Base Cabinets', width: 15, height: 34, depth: 24, msrp: 425, price: 297 },
    { itemCode: 'DB18', description: 'Drawer Base 18" (3 Drawer)', category: 'Base Cabinets', width: 18, height: 34, depth: 24, msrp: 465, price: 325 },
    { itemCode: 'DB24', description: 'Drawer Base 24" (4 Drawer)', category: 'Base Cabinets', width: 24, height: 34, depth: 24, msrp: 545, price: 381 },
    { itemCode: 'BBC36', description: 'Blind Base Corner 36"', category: 'Base Cabinets', width: 36, height: 34, depth: 24, msrp: 525, price: 367 },
    { itemCode: 'BBC42', description: 'Blind Base Corner 42"', category: 'Base Cabinets', width: 42, height: 34, depth: 24, msrp: 585, price: 409 },
    { itemCode: 'LS33', description: 'Lazy Susan Base 33"', category: 'Base Cabinets', width: 33, height: 34, depth: 33, msrp: 695, price: 486 },
    { itemCode: 'LS36', description: 'Lazy Susan Base 36"', category: 'Base Cabinets', width: 36, height: 34, depth: 36, msrp: 745, price: 521 },

    // Wall Cabinets
    { itemCode: 'W1230', description: 'Wall Cabinet 12"x30"', category: 'Wall Cabinets', width: 12, height: 30, depth: 12, msrp: 195, price: 136 },
    { itemCode: 'W1530', description: 'Wall Cabinet 15"x30"', category: 'Wall Cabinets', width: 15, height: 30, depth: 12, msrp: 225, price: 157 },
    { itemCode: 'W1830', description: 'Wall Cabinet 18"x30"', category: 'Wall Cabinets', width: 18, height: 30, depth: 12, msrp: 255, price: 178 },
    { itemCode: 'W2130', description: 'Wall Cabinet 21"x30"', category: 'Wall Cabinets', width: 21, height: 30, depth: 12, msrp: 285, price: 199 },
    { itemCode: 'W2430', description: 'Wall Cabinet 24"x30"', category: 'Wall Cabinets', width: 24, height: 30, depth: 12, msrp: 315, price: 220 },
    { itemCode: 'W2730', description: 'Wall Cabinet 27"x30"', category: 'Wall Cabinets', width: 27, height: 30, depth: 12, msrp: 345, price: 241 },
    { itemCode: 'W3030', description: 'Wall Cabinet 30"x30"', category: 'Wall Cabinets', width: 30, height: 30, depth: 12, msrp: 375, price: 262 },
    { itemCode: 'W3330', description: 'Wall Cabinet 33"x30"', category: 'Wall Cabinets', width: 33, height: 30, depth: 12, msrp: 405, price: 283 },
    { itemCode: 'W3630', description: 'Wall Cabinet 36"x30"', category: 'Wall Cabinets', width: 36, height: 30, depth: 12, msrp: 435, price: 304 },
    { itemCode: 'W1236', description: 'Wall Cabinet 12"x36"', category: 'Wall Cabinets', width: 12, height: 36, depth: 12, msrp: 225, price: 157 },
    { itemCode: 'W1536', description: 'Wall Cabinet 15"x36"', category: 'Wall Cabinets', width: 15, height: 36, depth: 12, msrp: 265, price: 185 },
    { itemCode: 'W1836', description: 'Wall Cabinet 18"x36"', category: 'Wall Cabinets', width: 18, height: 36, depth: 12, msrp: 305, price: 213 },
    { itemCode: 'W2436', description: 'Wall Cabinet 24"x36"', category: 'Wall Cabinets', width: 24, height: 36, depth: 12, msrp: 365, price: 255 },
    { itemCode: 'W3036', description: 'Wall Cabinet 30"x36"', category: 'Wall Cabinets', width: 30, height: 36, depth: 12, msrp: 425, price: 297 },
    { itemCode: 'W3636', description: 'Wall Cabinet 36"x36"', category: 'Wall Cabinets', width: 36, height: 36, depth: 12, msrp: 485, price: 339 },
    { itemCode: 'W1242', description: 'Wall Cabinet 12"x42"', category: 'Wall Cabinets', width: 12, height: 42, depth: 12, msrp: 265, price: 185 },
    { itemCode: 'W1542', description: 'Wall Cabinet 15"x42"', category: 'Wall Cabinets', width: 15, height: 42, depth: 12, msrp: 305, price: 213 },
    { itemCode: 'W1842', description: 'Wall Cabinet 18"x42"', category: 'Wall Cabinets', width: 18, height: 42, depth: 12, msrp: 345, price: 241 },
    { itemCode: 'W2442', description: 'Wall Cabinet 24"x42"', category: 'Wall Cabinets', width: 24, height: 42, depth: 12, msrp: 405, price: 283 },
    { itemCode: 'W3042', description: 'Wall Cabinet 30"x42"', category: 'Wall Cabinets', width: 30, height: 42, depth: 12, msrp: 465, price: 325 },
    { itemCode: 'W3642', description: 'Wall Cabinet 36"x42"', category: 'Wall Cabinets', width: 36, height: 42, depth: 12, msrp: 525, price: 367 },
    { itemCode: 'WBC2430', description: 'Wall Blind Corner 24"x30"', category: 'Wall Cabinets', width: 24, height: 30, depth: 12, msrp: 365, price: 255 },
    { itemCode: 'WBC2436', description: 'Wall Blind Corner 24"x36"', category: 'Wall Cabinets', width: 24, height: 36, depth: 12, msrp: 405, price: 283 },
    { itemCode: 'WBC2442', description: 'Wall Blind Corner 24"x42"', category: 'Wall Cabinets', width: 24, height: 42, depth: 12, msrp: 445, price: 311 },

    // Tall Cabinets
    { itemCode: 'T1884', description: 'Tall Pantry 18"x84"', category: 'Tall Cabinets', width: 18, height: 84, depth: 24, msrp: 895, price: 626 },
    { itemCode: 'T2484', description: 'Tall Pantry 24"x84"', category: 'Tall Cabinets', width: 24, height: 84, depth: 24, msrp: 995, price: 696 },
    { itemCode: 'T3084', description: 'Tall Pantry 30"x84"', category: 'Tall Cabinets', width: 30, height: 84, depth: 24, msrp: 1145, price: 801 },
    { itemCode: 'T3684', description: 'Tall Pantry 36"x84"', category: 'Tall Cabinets', width: 36, height: 84, depth: 24, msrp: 1295, price: 906 },
    { itemCode: 'T1896', description: 'Tall Pantry 18"x96"', category: 'Tall Cabinets', width: 18, height: 96, depth: 24, msrp: 995, price: 696 },
    { itemCode: 'T2496', description: 'Tall Pantry 24"x96"', category: 'Tall Cabinets', width: 24, height: 96, depth: 24, msrp: 1095, price: 766 },
    { itemCode: 'T3096', description: 'Tall Pantry 30"x96"', category: 'Tall Cabinets', width: 30, height: 96, depth: 24, msrp: 1245, price: 871 },
    { itemCode: 'OC3384', description: 'Oven Cabinet 33"x84"', category: 'Tall Cabinets', width: 33, height: 84, depth: 24, msrp: 845, price: 591 },
    { itemCode: 'OC3396', description: 'Oven Cabinet 33"x96"', category: 'Tall Cabinets', width: 33, height: 96, depth: 24, msrp: 945, price: 661 },

    // Specialty Cabinets
    { itemCode: 'RH30', description: 'Range Hood Cabinet 30"', category: 'Specialty Cabinets', width: 30, height: 12, depth: 12, msrp: 185, price: 129 },
    { itemCode: 'RH36', description: 'Range Hood Cabinet 36"', category: 'Specialty Cabinets', width: 36, height: 12, depth: 12, msrp: 215, price: 150 },
    { itemCode: 'MW30', description: 'Microwave Cabinet 30"', category: 'Specialty Cabinets', width: 30, height: 18, depth: 12, msrp: 245, price: 171 },
    { itemCode: 'REF36', description: 'Refrigerator Panel 36"', category: 'Specialty Cabinets', width: 36, height: 96, depth: 1, msrp: 165, price: 115 },
    { itemCode: 'DWP', description: 'Dishwasher Panel', category: 'Specialty Cabinets', width: 24, height: 34, depth: 1, msrp: 95, price: 66 },
    { itemCode: 'F330', description: 'Filler 3"x30"', category: 'Specialty Cabinets', width: 3, height: 30, depth: 1, msrp: 45, price: 31 },
    { itemCode: 'F336', description: 'Filler 3"x36"', category: 'Specialty Cabinets', width: 3, height: 36, depth: 1, msrp: 55, price: 38 },
    { itemCode: 'F342', description: 'Filler 3"x42"', category: 'Specialty Cabinets', width: 3, height: 42, depth: 1, msrp: 65, price: 45 },
    { itemCode: 'F396', description: 'Filler 3"x96"', category: 'Specialty Cabinets', width: 3, height: 96, depth: 1, msrp: 85, price: 59 },
    { itemCode: 'TK8', description: 'Toe Kick 8ft', category: 'Specialty Cabinets', width: 96, height: 4, depth: 1, msrp: 35, price: 24 },
    { itemCode: 'CM8', description: 'Crown Molding 8ft', category: 'Specialty Cabinets', width: 96, height: 3, depth: 3, msrp: 65, price: 45 },
    { itemCode: 'SM8', description: 'Scribe Molding 8ft', category: 'Specialty Cabinets', width: 96, height: 1, depth: 1, msrp: 25, price: 17 },

    // Vanity Cabinets
    { itemCode: 'V24', description: 'Vanity Base 24"', category: 'Vanity Cabinets', width: 24, height: 34, depth: 21, msrp: 345, price: 241 },
    { itemCode: 'V30', description: 'Vanity Base 30"', category: 'Vanity Cabinets', width: 30, height: 34, depth: 21, msrp: 395, price: 276 },
    { itemCode: 'V36', description: 'Vanity Base 36"', category: 'Vanity Cabinets', width: 36, height: 34, depth: 21, msrp: 445, price: 311 },
    { itemCode: 'V48', description: 'Vanity Base 48"', category: 'Vanity Cabinets', width: 48, height: 34, depth: 21, msrp: 545, price: 381 },
    { itemCode: 'V60', description: 'Vanity Base 60" (Double Sink)', category: 'Vanity Cabinets', width: 60, height: 34, depth: 21, msrp: 695, price: 486 },
    { itemCode: 'VDB15', description: 'Vanity Drawer Base 15"', category: 'Vanity Cabinets', width: 15, height: 34, depth: 21, msrp: 365, price: 255 },
    { itemCode: 'VDB18', description: 'Vanity Drawer Base 18"', category: 'Vanity Cabinets', width: 18, height: 34, depth: 21, msrp: 395, price: 276 },
  ];

  // Create products for each collection
  for (const collection of allCollections) {
    for (const product of baseProducts) {
      await prisma.product.upsert({
        where: {
          collectionId_itemCode: {
            collectionId: collection.id,
            itemCode: product.itemCode
          }
        },
        update: {
          description: product.description,
          category: product.category,
          width: product.width,
          height: product.height,
          depth: product.depth,
          msrp: product.msrp,
          price: product.price
        },
        create: {
          collectionId: collection.id,
          itemCode: product.itemCode,
          description: product.description,
          category: product.category,
          width: product.width,
          height: product.height,
          depth: product.depth,
          msrp: product.msrp,
          price: product.price
        }
      });
    }
  }

  console.log(`✅ Created ${baseProducts.length} products for each of ${allCollections.length} collections (${baseProducts.length * allCollections.length} total)`);

  // Create a sample customer
  console.log('Creating sample customer...');
  await prisma.customer.upsert({
    where: { email: 'johndoe@example.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      phone: '(555) 987-6543',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'CA',
      zipCode: '90210'
    }
  });
  console.log('✅ Sample customer created');

  console.log('\n✨ Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  Admin: admin@cabinetquoting.com / admin123');
  console.log('  Installer: installer@cabinetquoting.com / installer123');
  console.log('\n📦 Note: To import full product data, run:');
  console.log('  npx tsx src/scripts/import-products.ts');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
