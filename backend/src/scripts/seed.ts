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
      fullName: 'Admin User',
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
      fullName: 'John Installer',
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

  // Create sample styles for Essential & Charm collection
  const essentialCharm = await prisma.collection.findFirst({
    where: { name: 'Essential & Charm' }
  });

  if (essentialCharm) {
    const styles = [
      { code: 'SA', name: 'Shaker Smokey Ash', description: 'Smokey ash finish shaker style' },
      { code: 'AG', name: 'Shaker Aston Green', description: 'Aston green finish shaker style' },
      { code: 'SE', name: 'Shaker Espresso', description: 'Espresso finish shaker style' },
      { code: 'NB', name: 'Shaker Navy Blue', description: 'Navy blue finish shaker style' },
      { code: 'IB', name: 'Shaker Iron Black', description: 'Iron black finish shaker style' }
    ];

    for (const style of styles) {
      await prisma.style.upsert({
        where: {
          collectionId_code: {
            collectionId: essentialCharm.id,
            code: style.code
          }
        },
        update: { name: style.name, description: style.description },
        create: {
          collectionId: essentialCharm.id,
          code: style.code,
          name: style.name,
          description: style.description
        }
      });
    }

    console.log('✅ Sample styles created for Essential & Charm');
  }

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
