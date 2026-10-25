// backend/scripts/seed-consumables.js
// Fills the consumables table with sample chemicals and supplies for local testing.
// Safe to run more than once: an item whose name already exists is overwritten with the values
// in this file, so the sample data always matches this list. Other consumables are left alone.
//
// Usage (from source/backend, with the database running):
//   npm run seed:consumables
const { prisma } = require('../lib/prisma');

// Expiry dates are relative to today so "expiring soon" and "expired" stay true whenever this runs.
function daysFromToday(days) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const image = (text) => `https://placehold.co/400x300?text=${encodeURIComponent(text)}`;

// สร้างลิงก์รูปจาก Wikimedia Commons (redirect ไปยัง thumbnail ขนาด 400px อัตโนมัติ)
const commons = (file, width = 400) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

const CONSUMABLES = [
  // In stock
  { name: 'Agar Powder', description: 'Bacteriological grade, for culture media preparation', unit: 'g', currentStock: 500, reorderThreshold: 50, phValue: null, expiryDate: daysFromToday(520), imageUrl: commons('Agar-agar.jpg') },
  { name: 'Ethanol 95%', description: 'Denatured, for disinfection and extraction', unit: 'ml', currentStock: 2000, reorderThreshold: 500, phValue: null, expiryDate: daysFromToday(270), imageUrl: commons('Ethanol_Flasche.jpg') },
  { name: 'Sodium Chloride', description: 'ACS reagent, >= 99.0%', unit: 'g', currentStock: 3000, reorderThreshold: 100, phValue: 7, expiryDate: null, imageUrl: commons('Sodium_chloride_-_crystals.jpg') },
  { name: 'Distilled Water', description: 'Type II, for buffer and reagent preparation', unit: 'l', currentStock: 40, reorderThreshold: 10, phValue: 7, expiryDate: null, imageUrl: commons('Aqua-distillata.jpg') },
  { name: 'Glucose', description: 'D-(+)-Glucose, anhydrous, for media', unit: 'kg', currentStock: 5, reorderThreshold: 1, phValue: null, expiryDate: daysFromToday(700), imageUrl: commons('D-(+)-Glucose_monohydrate.jpg') },
  { name: 'Nitrile Gloves (M)', description: 'Powder-free, box of 100', unit: 'pieces', currentStock: 800, reorderThreshold: 200, phValue: null, expiryDate: null, imageUrl: commons('Nitrile_disposable_gloves.jpg') },
  { name: 'Pipette Tips 200 µl', description: 'Yellow, non-sterile, bulk bag', unit: 'pieces', currentStock: 5000, reorderThreshold: 1000, phValue: null, expiryDate: null, imageUrl: commons('Pipette_tips-different_1.jpg') },
  { name: 'Phosphate Buffered Saline', description: '1X PBS, sterile filtered', unit: 'ml', currentStock: 1500, reorderThreshold: 250, phValue: 7.4, expiryDate: daysFromToday(180), imageUrl: commons('Laboratory_glass_bottle-250ml.jpg') },
  { name: 'Acetic Acid (Glacial)', description: '>= 99.7%, ACS reagent', unit: 'ml', currentStock: 900, reorderThreshold: 200, phValue: 2.4, expiryDate: daysFromToday(400), imageUrl: commons('Acetic_acid.jpg') },
  { name: 'Methanol', description: 'HPLC grade', unit: 'l', currentStock: 8, reorderThreshold: 2, phValue: null, expiryDate: daysFromToday(330), imageUrl: commons('Methanol_by_Danny_S._-_001.JPG') },

  // Low stock (at or below reorder threshold)
  { name: 'Hydrochloric Acid', description: '37% fuming, ACS reagent', unit: 'ml', currentStock: 150, reorderThreshold: 200, phValue: 1, expiryDate: daysFromToday(90), imageUrl: commons('Hydrochloric_acid_05.jpg') },
  { name: 'Sodium Hydroxide', description: 'Pellets, >= 97%', unit: 'g', currentStock: 80, reorderThreshold: 100, phValue: 14, expiryDate: daysFromToday(250), imageUrl: commons('Sodium_hydroxide.jpg') },
  { name: 'Microscope Slides', description: 'Plain glass, 75 x 25 mm', unit: 'pieces', currentStock: 40, reorderThreshold: 50, phValue: null, expiryDate: null, imageUrl: commons('Microscope_slide_and_cover_slip.JPG') },

  // Out of stock
  { name: 'Petri Dish 90 mm', description: 'Sterile, polystyrene, single vent', unit: 'pieces', currentStock: 0, reorderThreshold: 50, phValue: null, expiryDate: daysFromToday(400), imageUrl: commons('Petri_dish.jpg') },
  { name: 'Crystal Violet Stain', description: '1% aqueous solution, for Gram staining', unit: 'ml', currentStock: 0, reorderThreshold: 100, phValue: null, expiryDate: daysFromToday(150), imageUrl: commons('Sample_of_Crystal_Violet.jpg') },

  // Expiring within 30 days
  { name: 'Hydrogen Peroxide 3%', description: 'Stabilised, for disinfection', unit: 'ml', currentStock: 600, reorderThreshold: 200, phValue: 4.5, expiryDate: daysFromToday(12), imageUrl: commons('Perhydrol.jpg') },
  { name: 'LB Broth', description: 'Lennox, ready-to-use liquid medium', unit: 'ml', currentStock: 750, reorderThreshold: 250, phValue: 7, expiryDate: daysFromToday(25), imageUrl: commons('LBmedium.JPG') },

  // Already expired
  { name: 'Trypsin-EDTA 0.25%', description: 'Cell culture grade, store at -20 °C', unit: 'ml', currentStock: 300, reorderThreshold: 100, phValue: 7.6, expiryDate: daysFromToday(-20), imageUrl: commons('Fetal_bovine_serum_cell_culture_medium.jpg') },
  { name: 'Iodine Solution', description: "Lugol's iodine, for starch test", unit: 'ml', currentStock: 120, reorderThreshold: 50, phValue: null, expiryDate: daysFromToday(-60), imageUrl: commons("Thiodine_Lugol's_Solution_of_Iodine.jpg") },
];

async function main() {
  let added = 0;
  let updated = 0;

  for (const item of CONSUMABLES) {
    const existing = await prisma.consumable.findFirst({ where: { name: item.name }, select: { consumableId: true } });
    if (existing) {
      await prisma.consumable.update({ where: { consumableId: existing.consumableId }, data: item });
      updated++;
    } else {
      await prisma.consumable.create({ data: item });
      added++;
    }
  }

  console.log(`Consumables seeded: ${added} added, ${updated} updated.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
