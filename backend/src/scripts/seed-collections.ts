import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const collectionsData = [
  {
    name: "Essential & Charm",
    description: "Classic and elegant cabinet collection with timeless appeal",
    styles: [
      { code: "SA", name: "Shaker Smokey Ash" },
      { code: "AG", name: "Shaker Aston Green" },
      { code: "SE", name: "Shaker Espresso" },
      { code: "NB", name: "Shaker Navy Blue" },
      { code: "IB", name: "Shaker Iron Black" },
      { code: "SW", name: "Shaker White" },
      { code: "GR", name: "Shaker Gray" },
      { code: "TC", name: "Shaker Taupe Cream" }
    ]
  },
  {
    name: "Classical & Double Shaker",
    description: "Traditional styling with double shaker door design",
    styles: [
      { code: "AW", name: "Antique White" },
      { code: "AC", name: "Antique Cream" },
      { code: "CW", name: "Classic White" },
      { code: "DDW", name: "Double Door White" },
      { code: "DSG", name: "Double Shaker Gray" }
    ]
  },
  {
    name: "Slim Shaker",
    description: "Modern slim profile shaker style cabinets",
    styles: [
      { code: "SDW", name: "Slim Door White" },
      { code: "SWO", name: "Slim White Oak" },
      { code: "SAG", name: "Slim Ash Gray" }
    ]
  },
  {
    name: "Frameless High Gloss",
    description: "Contemporary European-style frameless cabinets with high gloss finish",
    styles: [
      { code: "HW", name: "High Gloss White" },
      { code: "HG", name: "High Gloss Gray" }
    ]
  },
  {
    name: "Builder Grade",
    description: "Affordable quality cabinets for budget-conscious projects",
    styles: [
      { code: "FW", name: "Flat White" },
      { code: "FG", name: "Flat Gray" },
      { code: "FE", name: "Flat Espresso" }
    ]
  }
];

async function main() {
  console.log('🏗️  Seeding collections and styles...\n');

  for (const collectionData of collectionsData) {
    console.log(`Creating collection: ${collectionData.name}`);

    const collection = await prisma.collection.upsert({
      where: { name: collectionData.name },
      update: { description: collectionData.description },
      create: {
        name: collectionData.name,
        description: collectionData.description
      }
    });

    console.log(`  ✓ Collection created: ${collection.id}`);

    for (const styleData of collectionData.styles) {
      const style = await prisma.style.upsert({
        where: {
          collectionId_code: {
            collectionId: collection.id,
            code: styleData.code
          }
        },
        update: { name: styleData.name },
        create: {
          collectionId: collection.id,
          code: styleData.code,
          name: styleData.name
        }
      });
      console.log(`    - Style: ${style.code} - ${style.name}`);
    }
    console.log('');
  }

  console.log('✅ Collections and styles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
