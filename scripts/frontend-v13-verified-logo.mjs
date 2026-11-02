import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const expectedBytes = 15179;
const expectedSha256 = '4ad684ff1b0b45a90f762d07ca79bcccc65dffa822df8afc4f73c9311dbc6c5a';
const partDir = 'asset-parts';

const parts = readdirSync(partDir)
  .filter((name) => /^ygt-logo\.\d+\.b64$/.test(name))
  .sort();

if (parts.length !== 6) {
  throw new Error(`Expected 6 logo parts, found ${parts.length}`);
}

const base64 = parts.map((name) => readFileSync(join(partDir, name), 'utf8').trim()).join('');
const logo = Buffer.from(base64, 'base64');
const sha256 = createHash('sha256').update(logo).digest('hex');

if (logo.length !== expectedBytes) {
  throw new Error(`Logo byte-length mismatch: expected ${expectedBytes}, got ${logo.length}`);
}
if (sha256 !== expectedSha256) {
  throw new Error(`Logo checksum mismatch: expected ${expectedSha256}, got ${sha256}`);
}
if (logo[0] !== 0xff || logo[1] !== 0xd8 || logo.at(-2) !== 0xff || logo.at(-1) !== 0xd9) {
  throw new Error('Reconstructed logo is not a complete JPEG');
}

mkdirSync('public', { recursive: true });
writeFileSync('public/ygt-logo.jpg', logo);

function patchTree(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      patchTree(path);
      continue;
    }
    if (!/\.(jsx?|tsx?|css|html)$/.test(name)) continue;
    const before = readFileSync(path, 'utf8');
    const after = before
      .replaceAll('/logo-honda.jpg', '/ygt-logo.jpg')
      .replaceAll('/logo.jpg', '/ygt-logo.jpg')
      .replaceAll('/logo.png', '/ygt-logo.jpg');
    if (after !== before) writeFileSync(path, after, 'utf8');
  }
}

patchTree('src');
console.log(`Applied v13 verified logo: ${logo.length} bytes, sha256 ${sha256}.`);
