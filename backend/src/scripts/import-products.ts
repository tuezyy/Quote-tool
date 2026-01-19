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

// Helper function to parse styles from the nested array format
function parseStyles(stylesArray: any[]): string[] {
  const styles: string[] = [];

  for (const row of stylesArray) {
    if (Array.isArray(row)) {
      for (const cell of row) {
        if (cell && typeof cell === 'string') {
          // Split by multiple spaces or newlines to get individual styles
          const cellStyles = cell.split(/\s{2,}/).filter(s => s.trim());
          for (const style of cellStyles) {
            const trimmed = style.trim();
            if (trimmed && trimmed.includes('-')) {
              styles.push(trimmed);
            }
          }
        }
      }
    } else if (row && typeof row === 'string') {
      const trimmed = row.trim();
      if (trimmed && trimmed.includes('-')) {
        styles.push(trimmed);
      }
    }
  }

  return [...new Set(styles)]; // Remove duplicates
}

async function importProducts() {
  console.log('📦 Starting product import...\n');

  try {
    // Read product data from JSON file
    const dataPath = path.join(__dirname, '../data/products.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    let totalProducts = 0;
    let totalCollections = 0;

    // Iterate over collections (they are top-level keys in this format)
    for (const [collectionName, collectionData] of Object.entries(data)) {
      const collection_data = collectionData as any;
      console.log(`\n📁 Processing collection: ${collectionName}`);

      // Create or find collection
      const collection = await prisma.collection.upsert({
        where: { name: collectionName },
        update: {},
        create: {
          name: collectionName,
          description: `${collectionName} - ${collection_data.total_items || collection_data.items?.length || 0} products`
        }
      });

      totalCollections++;
      console.log(`  ✅ Collection created/found: ${collection.name}`);

      // Parse and create styles for this collection
      const styles = parseStyles(collection_data.styles || []);
      console.log(`  📋 Found ${styles.length} styles`);

      for (const styleName of styles) {
        // Parse style code and name (format: "CODE-Name Name Name")
        const dashIndex = styleName.indexOf('-');
        const code = dashIndex > 0 ? styleName.substring(0, dashIndex).trim() : styleName;
        const name = dashIndex > 0 ? styleName.substring(dashIndex + 1).trim() : styleName;

        await prisma.style.upsert({
          where: {
            collectionId_code: {
              collectionId: collection.id,
              code: code
            }
          },
          update: { name: name || code },
          create: {
            collectionId: collection.id,
            code: code,
            name: name || code
          }
        });
      }

      console.log(`  ✅ ${styles.length} styles created/updated`);

      // Import products
      let count = 0;
      const items = collection_data.items || [];

      for (const product of items) {
        const dimensions = parseDimensions(product.description || '');
        const doors = parseDoors(product.description || '');

        // Skip products with invalid pricing data
        const msrp = typeof product.msrp === 'number' ? product.msrp : null;
        const price = typeof product.price === 'number' ? product.price : null;

        if (msrp === null || price === null) {
          console.log(`  ⚠️  Skipping ${product.item_code} - invalid pricing`);
          continue;
        }

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
              msrp: msrp,
              price: price  // This is the installer's cost
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
              msrp: msrp,
              price: price  // This is the installer's cost
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

      console.log(`  ✅ Imported ${count} products for ${collectionName}`);
    }

    console.log(`\n\n✨ Import completed successfully!`);
    console.log(`📊 Total products imported: ${totalProducts}`);
    console.log(`📂 Total collections: ${totalCollections}`);

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
