// backend/utils/assignDefaultBanner.js
const fs = require('fs');
const path = require('path');

const DEFAULT_BANNER_DIR = path.join(__dirname, '..', 'public', 'defaultBanner');
const USER_IMAGES_ROOT = path.join(__dirname, '..', 'public', 'userImages');

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

function findDefaultBannerFile() {
  for (const ext of ALLOWED_EXTENSIONS) {
    const candidate = path.join(DEFAULT_BANNER_DIR, `bannerImage.${ext}`);
    if (fs.existsSync(candidate)) return { path: candidate, ext: ext === 'jpeg' ? 'jpg' : ext };
  }
  return null;
}

function assignDefaultBanner(userId) {
  try {
    const defaultFile = findDefaultBannerFile();
    if (!defaultFile) {
      throw new Error('No default banner image found in public/defaultBanner');
    }

    const userDir = path.join(USER_IMAGES_ROOT, String(userId));

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const destPath = path.join(userDir, `banner.${defaultFile.ext}`);
    fs.copyFileSync(defaultFile.path, destPath);

    return `/userImages/${userId}/banner.${defaultFile.ext}`;
  } catch (err) {
    console.error('Failed to assign default banner:', err.message);
    return null;
  }
}

module.exports = { assignDefaultBanner };