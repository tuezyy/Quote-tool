import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

async function importProducts() {
  console.log('📦 Starting product import...\n');

  try {
    // Read product data from JSON file
    const dataPath = path.join(__dirname, '../data/products.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    let totalProducts = 0;

    for (const collectionData of data.collections) {
      console.log(`\n📁 Processing collection: ${collectionData.name}`);

      // Create or find collection (no businessId — standalone import script)
      let collection = await prisma.collection.findFirst({ where: { name: collectionData.name } });
      if (!collection) {
        collection = await prisma.collection.create({
          data: {
            name: collectionData.name,
            description: `Collection with ${collectionData.product_count} products`
          }
        });
      }

      console.log(`  ✅ Collection created/found: ${collection.name}`);

      // Create styles for this collection
      for (const styleName of collectionData.styles) {
        const [code, ...nameParts] = styleName.split('-');
        const name = nameParts.join('-').trim();

        await prisma.style.upsert({
          where: {
            collectionId_code: {
              collectionId: collection.id,
              code: code
            }
          },
          update: {},
          create: {
            collectionId: collection.id,
            code: code,
            name: name || code
          }
        });
      }

      console.log(`  ✅ ${collectionData.styles.length} styles created/updated`);

      // Import products
      let count = 0;
      for (const product of collectionData.products) {
        const dimensions = parseDimensions(product.description);
        const doors = parseDoors(product.description);

        try {
          await prisma.product.upsert({
            where: {
              collectionId_itemCode: {
                collectionId: collection.id,
                itemCode: product.item_code
              }
            },
            update: {
              description: product.description,
              category: product.category,
              width: dimensions.width,
              height: dimensions.height,
              depth: dimensions.depth,
              doors: doors,
              msrp: product.msrp,
              price: product.your_price
            },
            create: {
              collectionId: collection.id,
              itemCode: product.item_code,
              description: product.description,
              category: product.category,
              width: dimensions.width,
              height: dimensions.height,
              depth: dimensions.depth,
              doors: doors,
              msrp: product.msrp,
              price: product.your_price
            }
          });

          count++;
          totalProducts++;

          if (count % 50 === 0) {
            process.stdout.write(`  📦 Imported ${count} products...\r`);
          }
        } catch (error) {
          console.error(`\n  ❌ Error importing product ${product.item_code}:`, error);
        }
      }

      console.log(`  ✅ Imported ${count} products for ${collectionData.name}`);
    }

    console.log(`\n\n✨ Import completed successfully!`);
    console.log(`📊 Total products imported: ${totalProducts}`);
    console.log(`📂 Total collections: ${data.collections.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

importProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
