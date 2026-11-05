// Saving avatars/banners: type detection from the first bytes, file replacement and URL format.
// fs is replaced with in-memory fakes, so nothing is written to public/userImages.
const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { saveUserImage, detectImageExtension } = require('../utils/saveUserImage');

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBP')]);
const ROOT = path.join(__dirname, '..', 'public', 'userImages');

describe('detectImageExtension', () => {
  test('recognises JPG, PNG and WEBP by their first bytes', () => {
    assert.equal(detectImageExtension(JPG), 'jpg');
    assert.equal(detectImageExtension(PNG), 'png');
    assert.equal(detectImageExtension(WEBP), 'webp');
  });

  test('rejects other formats', () => {
    assert.equal(detectImageExtension(Buffer.from('GIF89a------')), null);
    assert.equal(detectImageExtension(Buffer.from('%PDF-1.4 -----')), null);
    assert.equal(detectImageExtension(Buffer.from('<svg xmlns="x"></svg>')), null);
  });

  test('rejects a RIFF file that is not WEBP (e.g. WAV)', () => {
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WAVE')]);
    assert.equal(detectImageExtension(wav), null);
  });

  test('rejects a PNG whose signature is cut short or wrong', () => {
    assert.equal(detectImageExtension(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0b, 0, 0, 0, 0])), null);
  });

  test('rejects buffers shorter than 12 bytes, even with a valid start', () => {
    assert.equal(detectImageExtension(Buffer.from([0xff, 0xd8, 0xff])), null);
    assert.equal(detectImageExtension(Buffer.alloc(11, 0xff)), null);
    assert.equal(detectImageExtension(Buffer.alloc(0)), null);
  });

  test('rejects things that are not buffers', () => {
    assert.equal(detectImageExtension(null), null);
    assert.equal(detectImageExtension(undefined), null);
    assert.equal(detectImageExtension('ÿØÿà-----------'), null);
  });
});

describe('saveUserImage', () => {
  let existing; // paths that "exist" on the fake disk
  let written;
  let removed;
  let made;

  beforeEach(() => {
    existing = new Set();
    written = [];
    removed = [];
    made = [];
    mock.method(fs, 'mkdirSync', (dir, opts) => made.push([dir, opts]));
    mock.method(fs, 'existsSync', (p) => existing.has(p));
    mock.method(fs, 'unlinkSync', (p) => removed.push(p));
    mock.method(fs, 'writeFileSync', (p, data) => written.push([p, data]));
  });
  afterEach(() => mock.restoreAll());

  test('writes public/userImages/<id>/<kind>.<ext> and returns its URL with a cache-busting version', () => {
    const before = Date.now();
    const url = saveUserImage(7, 'avatar', PNG);
    assert.deepEqual(written, [[path.join(ROOT, '7', 'avatar.png'), PNG]]);
    const match = /^\/userImages\/7\/avatar\.png\?v=(\d+)$/.exec(url);
    assert.ok(match, url);
    assert.ok(Number(match[1]) >= before && Number(match[1]) <= Date.now());
  });

  test('the extension comes from the content, not from anything the client says', () => {
    assert.match(saveUserImage(1, 'banner', JPG), /^\/userImages\/1\/banner\.jpg\?v=/);
    assert.match(saveUserImage(1, 'banner', WEBP), /^\/userImages\/1\/banner\.webp\?v=/);
  });

  test("creates the user's folder", () => {
    saveUserImage(3, 'avatar', JPG);
    assert.deepEqual(made, [[path.join(ROOT, '3'), { recursive: true }]]);
  });

  test('removes the previous picture of the same kind, whatever its extension', () => {
    existing.add(path.join(ROOT, '3', 'avatar.jpg'));
    existing.add(path.join(ROOT, '3', 'avatar.webp'));
    saveUserImage(3, 'avatar', PNG);
    assert.deepEqual(removed.sort(), [path.join(ROOT, '3', 'avatar.jpg'), path.join(ROOT, '3', 'avatar.webp')].sort());
  });

  test('leaves the other kind alone (changing the avatar keeps the banner)', () => {
    existing.add(path.join(ROOT, '3', 'banner.png'));
    saveUserImage(3, 'avatar', PNG);
    assert.deepEqual(removed, []);
  });

  test('a file that is not an image is refused with 415 and nothing is touched', () => {
    assert.throws(
      () => saveUserImage(3, 'avatar', Buffer.from('not an image at all')),
      (err) => err.status === 415 && /JPG, PNG or WEBP/.test(err.message),
    );
    assert.deepEqual([made, removed, written], [[], [], []]);
  });

  test('an unknown kind is refused before looking at the file', () => {
    assert.throws(() => saveUserImage(3, 'cover', PNG), /Unknown image kind: cover/);
    assert.deepEqual(written, []);
  });

  test('users cannot write into each other\'s folder: the id becomes a single path segment', () => {
    saveUserImage('5', 'avatar', JPG);
    assert.equal(path.dirname(written[0][0]), path.join(ROOT, '5'));
  });
});
