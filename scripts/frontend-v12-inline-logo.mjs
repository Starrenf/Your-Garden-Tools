import { readFileSync, writeFileSync } from 'node:fs';

let main = readFileSync('src/main.jsx', 'utf8');
const logo = readFileSync('public/logo-honda.jpg').toString('base64');
const dataUri = `data:image/jpeg;base64,${logo}`;

if (!main.includes('const YGT_LOGO=')) {
  const anchor = "const STORE=";
  if (!main.includes(anchor)) throw new Error('STORE anchor not found for logo injection');
  main = main.replace(anchor, `const YGT_LOGO=${JSON.stringify(dataUri)};\n${anchor}`);
}

main = main
  .replaceAll('src="/logo.jpg"', 'src={YGT_LOGO}')
  .replaceAll('src="/logo-honda.jpg"', 'src={YGT_LOGO}')
  .replaceAll('src="/logo.png"', 'src={YGT_LOGO}');

writeFileSync('src/main.jsx', main, 'utf8');
console.log('Applied v12 inline Honda logo to all React logo images.');
