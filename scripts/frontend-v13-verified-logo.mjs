import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const assetPath = 'public/ygt-logo.webp';
const expectedBytes = 14832;
const expectedSha256 = 'a777255f3f0876f6df22d7303669f3dc3a9798846593e97a4aea230943f9ac8d';
const logo = readFileSync(assetPath);
const actualSha256 = createHash('sha256').update(logo).digest('hex');
if (logo.length !== expectedBytes || actualSha256 !== expectedSha256) {
  throw new Error('The Honda mower logo does not match the approved asset.');
}
if (logo.toString('ascii', 0, 4) !== 'RIFF' || logo.toString('ascii', 8, 12) !== 'WEBP') {
  throw new Error('The approved logo must be a valid WebP file.');
}

function patch(dir) {
  for (const file of readdirSync(dir)) {
    const path = join(dir, file);
    if (statSync(path).isDirectory()) { patch(path); continue; }
    if (!/\.(jsx?|tsx?|css|html)$/.test(file)) continue;
    const before = readFileSync(path, 'utf8');
    const after = before
      .replaceAll('/logo-honda.jpg', '/ygt-logo.webp')
      .replaceAll('/ygt-logo.jpg', '/ygt-logo.webp')
      .replaceAll('/logo.jpg', '/ygt-logo.webp')
      .replaceAll('/logo.png', '/ygt-logo.webp')
      .replaceAll('<span className="mowerBrandBadge">HONDA</span>', '');
    if (after !== before) writeFileSync(path, after, 'utf8');
  }
}
patch('src');
console.log('Approved Honda logo applied to all frontend modules; detached badge removed.');
