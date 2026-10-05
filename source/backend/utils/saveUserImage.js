// backend/utils/saveUserImage.js
// Saves an uploaded avatar/banner for a user into public/userImages/<userId>/.
// The file type is detected from the file's first bytes (not trusted from the client).
const fs = require('fs');
const path = require('path');

const USER_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'userImages');
const EXTENSIONS = ['jpg', 'png', 'webp'];
const KINDS = ['avatar', 'banner'];

function detectImageExtension(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  // WEBP: "RIFF" .... "WEBP"
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/**
 * @param {number} userId
 * @param {'avatar'|'banner'} kind
 * @param {Buffer} buffer
 * @returns {string} public URL, e.g. /userImages/3/avatar.png?v=1700000000000
 */
function saveUserImage(userId, kind, buffer) {
  if (!KINDS.includes(kind)) throw new Error(`Unknown image kind: ${kind}`);

  const ext = detectImageExtension(buffer);
  if (!ext) {
    const err = new Error('Only JPG, PNG or WEBP images are allowed');
    err.status = 415;
    throw err;
  }

  const userDir = path.join(USER_IMAGES_ROOT, String(userId));
  fs.mkdirSync(userDir, { recursive: true });

  // remove the previous file of this kind (it may have a different extension)
  for (const oldExt of EXTENSIONS) {
    const oldPath = path.join(userDir, `${kind}.${oldExt}`);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const filename = `${kind}.${ext}`;
  fs.writeFileSync(path.join(userDir, filename), buffer);

  // ?v= busts the browser cache, since the file name stays the same after each upload
  return `/userImages/${userId}/${filename}?v=${Date.now()}`;
}

module.exports = { saveUserImage, detectImageExtension };
