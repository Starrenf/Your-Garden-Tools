import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('src',{recursive:true});
const joinParts=(name,count)=>Array.from({length:count},(_,i)=>readFileSync(join('source-parts',`${name}.${String(i).padStart(2,'0')}.part`),'utf8')).join('');
writeFileSync('src/main.jsx',joinParts('main',5),'utf8');
writeFileSync('src/styles.css',joinParts('styles',5),'utf8');
console.log('Restored exact Your Garden Tools v6 source from supplied ZIP parts.');
