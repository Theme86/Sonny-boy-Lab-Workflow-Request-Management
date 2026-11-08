// backend/scripts/seed-consumables.js
// Fills the hazards list (the 9 GHS pictograms), the property tags, and sample chemicals and supplies
// for local testing. Safe to run more than once: a hazard (by code), property or consumable (by name)
// that already exists is overwritten with the values in this file, so the sample data always matches.
// Other consumables are left alone.
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

const HAZARDS = [
  { code: 'GHS01', name: 'Explosive', description: 'Unstable explosives, self-reactive substances' },
  { code: 'GHS02', name: 'Flammable', description: 'Flammable gases, liquids and solids' },
  { code: 'GHS03', name: 'Oxidizer', description: 'Can cause or intensify fire' },
  { code: 'GHS04', name: 'Compressed gas', description: 'Gas under pressure, may explode if heated' },
  { code: 'GHS05', name: 'Corrosive', description: 'Causes severe skin burns and eye damage' },
  { code: 'GHS06', name: 'Acute toxicity', description: 'Fatal or toxic if swallowed, inhaled or on skin' },
  { code: 'GHS07', name: 'Irritant', description: 'Skin or eye irritation, harmful' },
  { code: 'GHS08', name: 'Health hazard', description: 'Carcinogen, mutagen or organ toxicity' },
  { code: 'GHS09', name: 'Environmental', description: 'Toxic to aquatic life' },
];

// GHS codes per sample consumable (by name); items not listed have no hazards
const CONSUMABLE_HAZARDS = {
  'Ethanol 95%': ['GHS02', 'GHS07'],
  'Acetic Acid (Glacial)': ['GHS02', 'GHS05'],
  Methanol: ['GHS02', 'GHS06', 'GHS08'],
  'Hydrochloric Acid': ['GHS05', 'GHS07'],
  'Sodium Hydroxide': ['GHS05'],
  'Crystal Violet Stain': ['GHS05', 'GHS08', 'GHS09'],
  'Hydrogen Peroxide 3%': ['GHS07'],
  'Iodine Solution': ['GHS07'],
};

// storage / handling tags (consumable_property has no unique column, so these are matched by name)
const PROPERTIES = [
  { name: 'Light sensitive', description: 'Store in an amber bottle, away from light' },
  { name: 'Keep refrigerated', description: 'Store at 2–8 °C' },
  { name: 'Keep frozen', description: 'Store at -20 °C or below' },
  { name: 'Hygroscopic', description: 'Absorbs moisture; keep tightly closed' },
  { name: 'Volatile', description: 'Evaporates quickly; keep capped and use in a fume hood' },
  { name: 'Sterile', description: 'Open only in a clean or sterile area' },
  { name: 'Single use', description: 'Discard after one use' },
];

// property names per sample consumable (by name); items not listed have no properties
const CONSUMABLE_PROPERTIES = {
  'Agar Powder': ['Hygroscopic'],
  'Ethanol 95%': ['Volatile'],
  Glucose: ['Hygroscopic'],
  'Nitrile Gloves (M)': ['Single use'],
  'Pipette Tips 200 µl': ['Single use'],
  'Phosphate Buffered Saline': ['Sterile'],
  'Acetic Acid (Glacial)': ['Volatile'],
  Methanol: ['Volatile'],
  'Hydrochloric Acid': ['Volatile'],
  'Sodium Hydroxide': ['Hygroscopic'],
  'Petri Dish 90 mm': ['Sterile', 'Single use'],
  'Hydrogen Peroxide 3%': ['Light sensitive'],
  'LB Broth': ['Sterile', 'Keep refrigerated'],
  'Trypsin-EDTA 0.25%': ['Sterile', 'Keep frozen'],
  'Iodine Solution': ['Light sensitive'],
};

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

async function seedHazards() {
  const idByCode = {};
  for (const { code, ...rest } of HAZARDS) {
    const hazard = await prisma.hazard.upsert({ where: { code }, create: { code, ...rest }, update: rest });
    idByCode[code] = hazard.hazardId;
  }
  console.log(`Hazards seeded: ${HAZARDS.length}.`);
  return idByCode;
}

async function seedProperties() {
  const idByName = {};
  for (const { name, description } of PROPERTIES) {
    const existing = await prisma.consumableProperty.findFirst({ where: { name }, select: { propertyId: true } });
    const property = existing
      ? await prisma.consumableProperty.update({ where: { propertyId: existing.propertyId }, data: { description } })
      : await prisma.consumableProperty.create({ data: { name, description } });
    idByName[name] = property.propertyId;
  }
  console.log(`Properties seeded: ${PROPERTIES.length}.`);
  return idByName;
}

// replaces the item's links in one join table (haz_con or prop_con) with the given ids
async function replaceLinks(join, key, consumableId, ids) {
  await prisma[join].deleteMany({ where: { consumableId } });
  if (ids.length) await prisma[join].createMany({ data: ids.map((id) => ({ consumableId, [key]: id })) });
}

async function main() {
  const hazardIds = await seedHazards();
  const propertyIds = await seedProperties();
  let added = 0;
  let updated = 0;

  for (const item of CONSUMABLES) {
    const existing = await prisma.consumable.findFirst({ where: { name: item.name }, select: { consumableId: true } });
    let consumableId;
    if (existing) {
      consumableId = existing.consumableId;
      await prisma.consumable.update({ where: { consumableId }, data: item });
      updated++;
    } else {
      consumableId = (await prisma.consumable.create({ data: item })).consumableId;
      added++;
    }
    const hazards = (CONSUMABLE_HAZARDS[item.name] ?? []).map((code) => hazardIds[code]);
    const properties = (CONSUMABLE_PROPERTIES[item.name] ?? []).map((name) => propertyIds[name]);
    await replaceLinks('hazCon', 'hazardId', consumableId, hazards);
    await replaceLinks('propCon', 'propertyId', consumableId, properties);
  }

  console.log(`Consumables seeded: ${added} added, ${updated} updated.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
