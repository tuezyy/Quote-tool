import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const installerPassword = await bcrypt.hash('installer123', 10);

  // Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@cabinetquoting.com' },
    update: {},
    create: {
      email: 'admin@cabinetquoting.com',
      password: adminPassword,
    },
  });

  // Create Installer
  await prisma.user.upsert({
    where: { email: 'installer@cabinetquoting.com' },
    update: {},
    create: {
      email: 'installer@cabinetquoting.com',
      password: installerPassword,
    },
  });

  console.log('🌱 Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
