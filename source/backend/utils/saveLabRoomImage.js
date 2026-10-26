// Saves a room photo into public/labRoomImages/<roomId>/.
const fs = require('fs');
const path = require('path');
const { detectImageExtension } = require('./saveUserImage');

const ROOM_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'labRoomImages');
const EXTENSIONS = ['jpg', 'png', 'webp'];

function saveLabRoomImage(roomId, buffer) {
  const ext = detectImageExtension(buffer);
  if (!ext) {
    const err = new Error('Only JPG, PNG or WEBP images are allowed');
    err.status = 415;
    throw err;
  }

  const dir = path.join(ROOM_IMAGES_ROOT, String(roomId));
  fs.mkdirSync(dir, { recursive: true });
  for (const oldExt of EXTENSIONS) {
    const oldFile = path.join(dir, `photo.${oldExt}`);
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  const filename = `photo.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/labRoomImages/${roomId}/${filename}?v=${Date.now()}`;
}

function deleteLabRoomImage(roomId) {
  fs.rmSync(path.join(ROOM_IMAGES_ROOT, String(roomId)), { recursive: true, force: true });
}

module.exports = { saveLabRoomImage, deleteLabRoomImage };
