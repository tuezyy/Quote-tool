import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const productData = {
  "metadata": {
    "total_products": 1044,
    "collections_count": 5,
    "export_date": "2026-01-18"
  },
  "collections": [
    {
      "name": "Essential & Charm",
      "styles": [
        "SA-Shaker Smokey Ash",
        "AG-Shaker Aston Green",
        "SE-Shaker Expresso",
        "NB-Shaker Navy Blue",
        "IB-Shaker Iron Black"
      ],
      "product_count": 261,
      "products": ${JSON.stringify([
        {
          "item_code": "W1212GD",
          "description": "Wall Cabinet - 12\"W x 12\"H x 12\"D - 1D",
          "category": "WALL CABINETS - 12\"H",
          "msrp": 103.0,
          "your_price": 41.2
        }
      ])} // Abbreviated for demo - full data will be added
    }
  ]
};

// Helper function to parse dimensions from description
function parseDimensions(description: string) {
  const match = description.match(/(\d+)"W x (\d+)"H x (\d+)"D/);
  if (match) {
    return {
      width: parseInt(match[1]),
      height: parseInt(match[2]),
      depth: parseInt(match[3])
    };
  }
  return { width: null, height: null, depth: null };
}

// Helper function to parse doors from description
function parseDoors(description: string) {
  const match = description.match(/(\d+D)/);
  return match ? match[1] : null;
}

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
      value: 'Cabinet Routing & Installation Co.'
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

  console.log('✅ Default settings created');

  console.log('\n📦 Importing collections and products...');

  // Note: You'll need to provide the full product JSON data here
  // For now, this is a skeleton that shows the structure

  console.log('⚠️  Product data import not yet implemented');
  console.log('   Please run the import script separately with full product data');

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
