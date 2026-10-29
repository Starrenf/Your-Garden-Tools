import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('src',{recursive:true});
const readParts=(name,count)=>Array.from({length:count},(_,i)=>readFileSync(join('source-parts',`${name}.${String(i).padStart(2,'0')}.part`),'utf8'));
const mainParts=readParts('main',5);
// Herstel exact het ene teken dat op de transportgrens tussen part 02 en 03 hoort.
mainParts[2]+='<';
writeFileSync('src/main.jsx',mainParts.join(''),'utf8');
writeFileSync('src/styles.css',readParts('styles',5).join(''),'utf8');
console.log('Restored exact Your Garden Tools v6 source from supplied ZIP parts.');
