// Saves a consumable photo into public/consumableImages/<consumableId>/.
const fs = require('fs');
const path = require('path');
const { detectImageExtension } = require('./saveUserImage');

const CONSUMABLE_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'consumableImages');
const EXTENSIONS = ['jpg', 'png', 'webp'];

function saveConsumableImage(consumableId, buffer) {
  const ext = detectImageExtension(buffer);
  if (!ext) {
    const err = new Error('Only JPG, PNG or WEBP images are allowed');
    err.status = 415;
    throw err;
  }

  const dir = path.join(CONSUMABLE_IMAGES_ROOT, String(consumableId));
  fs.mkdirSync(dir, { recursive: true });
  for (const oldExt of EXTENSIONS) {
    const oldFile = path.join(dir, `photo.${oldExt}`);
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  const filename = `photo.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/consumableImages/${consumableId}/${filename}?v=${Date.now()}`;
}

function deleteConsumableImage(consumableId) {
  fs.rmSync(path.join(CONSUMABLE_IMAGES_ROOT, String(consumableId)), { recursive: true, force: true });
}

module.exports = { saveConsumableImage, deleteConsumableImage };
