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

  // Create sample collections for demo purposes
  console.log('Creating sample collections...');

  const collections = [
    { name: 'Essential & Charm', description: 'Classic shaker style cabinets in various finishes' },
    { name: 'Classical & Double Shaker', description: 'Traditional double shaker door designs' },
    { name: 'Slim Shaker', description: 'Modern slim profile shaker cabinets' },
    { name: 'Frameless High Gloss', description: 'Contemporary frameless high gloss cabinets' },
    { name: 'Builder Grade', description: 'Economical builder grade cabinet options' }
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { name: collection.name },
      update: { description: collection.description },
      create: collection
    });
  }

  console.log('✅ Sample collections created');

  // Create sample styles for all collections
  const allCollections = await prisma.collection.findMany();

  const stylesByCollection: Record<string, Array<{ code: string; name: string; description: string }>> = {
    'Essential & Charm': [
      { code: 'SA', name: 'Shaker Smokey Ash', description: 'Smokey ash finish shaker style' },
      { code: 'AG', name: 'Shaker Aston Green', description: 'Aston green finish shaker style' },
      { code: 'SE', name: 'Shaker Espresso', description: 'Espresso finish shaker style' },
      { code: 'NB', name: 'Shaker Navy Blue', description: 'Navy blue finish shaker style' },
      { code: 'IB', name: 'Shaker Iron Black', description: 'Iron black finish shaker style' }
    ],
    'Classical & Double Shaker': [
      { code: 'DW', name: 'Double Shaker White', description: 'Classic white double shaker' },
      { code: 'DG', name: 'Double Shaker Gray', description: 'Gray double shaker finish' },
      { code: 'DN', name: 'Double Shaker Natural', description: 'Natural wood double shaker' }
    ],
    'Slim Shaker': [
      { code: 'SW', name: 'Slim White', description: 'Modern slim profile white' },
      { code: 'SG', name: 'Slim Gray', description: 'Modern slim profile gray' },
      { code: 'SB', name: 'Slim Black', description: 'Modern slim profile black' }
    ],
    'Frameless High Gloss': [
      { code: 'HGW', name: 'High Gloss White', description: 'Brilliant high gloss white' },
      { code: 'HGG', name: 'High Gloss Gray', description: 'Sleek high gloss gray' },
      { code: 'HGB', name: 'High Gloss Black', description: 'Bold high gloss black' }
    ],
    'Builder Grade': [
      { code: 'BGW', name: 'Builder White', description: 'Economical white finish' },
      { code: 'BGO', name: 'Builder Oak', description: 'Economical oak finish' },
      { code: 'BGM', name: 'Builder Maple', description: 'Economical maple finish' }
    ]
  };

  for (const collection of allCollections) {
    const styles = stylesByCollection[collection.name] || [];

    for (const style of styles) {
      await prisma.style.upsert({
        where: {
          collectionId_code: {
            collectionId: collection.id,
            code: style.code
          }
        },
        update: { name: style.name, description: style.description },
        create: {
          collectionId: collection.id,
          code: style.code,
          name: style.name,
          description: style.description
        }
      });
    }
  }

  console.log('✅ Sample styles created for all collections');

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
