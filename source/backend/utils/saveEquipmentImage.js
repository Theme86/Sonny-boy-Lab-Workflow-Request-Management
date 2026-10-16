// Saves the photo of one equipment item into public/equipmentImages/<equipmentId>/.
const fs = require('fs');
const path = require('path');
const { detectImageExtension } = require('./saveUserImage');
 
const EQUIPMENT_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'equipmentImages');
const EXTENSIONS = ['jpg', 'png', 'webp'];
 
function removeOldFiles(dir) {
  for (const ext of EXTENSIONS) {
    const file = path.join(dir, `photo.${ext}`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}
 
function saveEquipmentImage(equipmentId, buffer) {
  const ext = detectImageExtension(buffer);
  if (!ext) {
    const err = new Error('Only JPG, PNG or WEBP images are allowed');
    err.status = 415;
    throw err;
  }
 
  const dir = path.join(EQUIPMENT_IMAGES_ROOT, String(equipmentId));
  fs.mkdirSync(dir, { recursive: true });
  removeOldFiles(dir); // the previous photo may have a different extension
 
  const filename = `photo.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
 
  // ?v= busts the browser cache, because the file name stays the same after each upload
  return `/equipmentImages/${equipmentId}/${filename}?v=${Date.now()}`;
}
 
function deleteEquipmentImage(equipmentId) {
  try {
    fs.rmSync(path.join(EQUIPMENT_IMAGES_ROOT, String(equipmentId)), { recursive: true, force: true });
  } catch {
  }
}
 
module.exports = { saveEquipmentImage, deleteEquipmentImage };