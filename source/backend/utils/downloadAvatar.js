// backend/utils/downloadAvatar.js
const fs = require('fs');
const path = require('path');

const USER_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'userImages');

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};


async function downloadAvatar(imageUrl, userId) {
  try {
    const userDir = path.join(USER_IMAGES_ROOT, String(userId));

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.status}`);

    const contentType = res.headers.get('content-type');
    const extension = ALLOWED_TYPES[contentType];

    if (!extension) {
      throw new Error(`Unsupported image type: ${contentType}`);
    }

    // remove any previous avatar with a different extension (e.g. re-login switched jpg->png)
    for (const ext of Object.values(ALLOWED_TYPES)) {
      const oldPath = path.join(userDir, `avatar.${ext}`);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `avatar.${extension}`;
    const filepath = path.join(userDir, filename);

    fs.writeFileSync(filepath, buffer);

    return `/userImages/${userId}/${filename}`;
  } catch (err) {
    console.error('Avatar download failed:', err.message);
    return null;
  }
}

module.exports = { downloadAvatar };