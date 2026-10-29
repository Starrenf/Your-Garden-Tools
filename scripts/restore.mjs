import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('src',{recursive:true});
mkdirSync('public',{recursive:true});
const readParts=(name,count)=>Array.from({length:count},(_,i)=>readFileSync(join('source-parts',`${name}.${String(i).padStart(2,'0')}.part`),'utf8'));
const mainParts=readParts('main',5);
// Herstel exact het ene teken dat op de transportgrens tussen part 02 en 03 hoort.
mainParts[2]+='<';
let main=mainParts.join('').replaceAll('/logo.png','/logo.jpg');

const navOld=`<a href="#top" className="logoFrame" aria-label="Your Garden Tools"><img src="/logo.jpg" alt="Your Garden Tools logo"/></a>`;
const navNew=`<a href="#top" className="logoFrame" aria-label="Your Garden Tools"><img src="/logo.jpg" alt="Your Garden Tools logo"/><span className="navBrandText"><strong>Ludo Neven</strong><small>Tuin- & parkmachines</small></span></a>`;
main=main.replace(navOld,navNew);

const heroOld=`<div className="heroLogoFrame"><img className="heroLogo" src="/logo.jpg" alt="Your Garden Tools"/></div>`;
const heroNew=`<div className="heroLogoFrame"><img className="heroLogo" src="/logo.jpg" alt="Your Garden Tools"/></div><div className="brandTextBlock"><strong>Ludo Neven</strong><span>Advies · Onderhoud · Reparatie · Verkoop</span><small>Tuin- & parkmachines</small></div>`;
main=main.replace(heroOld,heroNew);

const showcaseOld=`<img src="/logo.jpg" alt="Your Garden Tools logo"/><div className="brandInfo">`;
const showcaseNew=`<img src="/logo.jpg" alt="Your Garden Tools logo"/><div className="showcaseBrandText"><strong>Ludo Neven</strong><span>Advies · Onderhoud · Reparatie · Verkoop</span><small>Tuin- & parkmachines</small></div><div className="brandInfo">`;
main=main.replace(showcaseOld,showcaseNew);

const css=readParts('styles',5).join('')+`
/* Leesbare bedrijfsinformatie los van het beeldmerk */
.logoFrame{gap:14px;justify-content:flex-start}
.logoFrame img{width:190px;height:auto}
.navBrandText{display:flex;flex-direction:column;line-height:1.1;min-width:150px}
.navBrandText strong{font-size:15px;letter-spacing:-.02em;color:var(--dark)}
.navBrandText small{font-size:10px;color:#78847a;margin-top:5px;white-space:nowrap}
.brandTextBlock{display:flex;flex-direction:column;margin:4px 0 18px;padding-left:3px;line-height:1.15}
.brandTextBlock strong{font-size:24px;letter-spacing:-.035em;color:var(--dark)}
.brandTextBlock span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6a8f48;margin-top:5px}
.brandTextBlock small{font-size:13px;color:#667268;margin-top:5px}
.showcaseBrandText{position:relative;z-index:1;display:flex;flex-direction:column;gap:3px;margin-top:-4px}
.showcaseBrandText strong{font-size:20px;letter-spacing:-.03em;color:var(--dark)}
.showcaseBrandText span{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#6f984a}
.showcaseBrandText small{font-size:11px;color:#718076}
@media(max-width:1100px){.logoFrame img{width:170px}.navBrandText strong{font-size:14px}.navBrandText small{font-size:9px}}
@media(max-width:900px){.navBrandText{display:none}.logoFrame img{width:min(220px,42vw)}.heroLogoFrame{margin-bottom:10px}.brandTextBlock strong{font-size:22px}.brandTextBlock span{font-size:11px}.brandTextBlock small{font-size:12px}}
@media(max-width:760px){.logoFrame img{width:168px}.brandTextBlock{margin-bottom:14px}}
@media(max-width:430px){.logoFrame img{width:145px}}
`;

const logoBase64=readParts('logo',3).join('');
writeFileSync('public/logo.jpg',Buffer.from(logoBase64,'base64'));
writeFileSync('src/main.jsx',main,'utf8');
writeFileSync('src/styles.css',css,'utf8');
console.log('Restored Your Garden Tools v7 responsive/flashy build with simplified logo.');
