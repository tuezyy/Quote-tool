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
  await prisma.setting.upsert({
    where: { key: 'tax_rate' },
    update: {},
    create: {
      key: 'tax_rate',
      value: '0.0875'
    }
  });

  await prisma.setting.upsert({
    where: { key: 'company_name' },
    update: {},
    create: {
      key: 'company_name',
      value: 'Cabinet Quoting & Installation Co.'
    }
  });

  await prisma.setting.upsert({
    where: { key: 'company_email' },
    update: {},
    create: {
      key: 'company_email',
      value: 'info@cabinetquoting.com'
    }
  });

  await prisma.setting.upsert({
    where: { key: 'company_phone' },
    update: {},
    create: {
      key: 'company_phone',
      value: '(555) 123-4567'
    }
  });

  await prisma.setting.upsert({
    where: { key: 'company_address' },
    update: {},
    create: {
      key: 'company_address',
      value: ''
    }
  });

  console.log('✅ Default settings created');

  console.log('\n✨ Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  Admin: admin@cabinetquoting.com / admin123');
  console.log('  Installer: installer@cabinetquoting.com / installer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
