import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('src',{recursive:true});
const readParts=(name,count)=>Array.from({length:count},(_,i)=>readFileSync(join('source-parts',`${name}.${String(i).padStart(2,'0')}.part`),'utf8'));
const mainParts=readParts('main',5);
// Herstel exact het ene teken dat op de transportgrens tussen part 02 en 03 hoort.
mainParts[2]+='<';
let main=mainParts.join('').replaceAll('/logo.png','/logo.jpg');

const navOld=`<a href="#top" className="logoFrame" aria-label="Your Garden Tools"><img src="/logo.jpg" alt="Your Garden Tools logo"/></a>`;
const navNew=`<a href="#top" className="logoFrame" aria-label="Your Garden Tools"><img src="/logo.jpg" alt="Your Garden Tools logo"/><span className="navBrandText"><strong>Your Garden Tools</strong><small>Ludo Neven · Tuin- & parkmachines</small></span></a>`;
main=main.replace(navOld,navNew);

const heroOld=`<div className="heroLogoFrame"><img className="heroLogo" src="/logo.jpg" alt="Your Garden Tools"/></div>`;
const heroNew=`<div className="heroLogoFrame"><img className="heroLogo" src="/logo.jpg" alt="Your Garden Tools"/></div><div className="brandTextBlock"><strong>Your Garden Tools</strong><span>Ludo Neven</span><small>Advies · Onderhoud · Reparatie · Verkoop</small><small>Tuin- & parkmachines</small></div>`;
main=main.replace(heroOld,heroNew);

const showcaseOld=`<img src="/logo.jpg" alt="Your Garden Tools logo"/><div className="brandInfo">`;
const showcaseNew=`<img src="/logo.jpg" alt="Your Garden Tools logo"/><div className="showcaseBrandText"><strong>Your Garden Tools</strong><span>Ludo Neven</span><small>Advies · Onderhoud · Reparatie · Verkoop</small></div><div className="brandInfo">`;
main=main.replace(showcaseOld,showcaseNew);

const css=readParts('styles',5).join('')+`
/* Leesbare branding buiten het beeldmerk */
.logoFrame{gap:14px;justify-content:flex-start}
.logoFrame img{height:52px}
.navBrandText{display:flex;flex-direction:column;line-height:1.1;min-width:170px}
.navBrandText strong{font-size:16px;letter-spacing:-.02em;color:var(--dark)}
.navBrandText small{font-size:10px;color:#78847a;margin-top:5px;white-space:nowrap}
.brandTextBlock{display:flex;flex-direction:column;margin:6px 0 18px;padding-left:3px;line-height:1.15}
.brandTextBlock strong{font-size:28px;letter-spacing:-.035em;color:var(--dark)}
.brandTextBlock span{font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#6a8f48;margin-top:5px}
.brandTextBlock small{font-size:13px;color:#667268;margin-top:5px}
.showcaseBrandText{position:relative;z-index:1;display:flex;flex-direction:column;gap:3px;margin-top:-4px}
.showcaseBrandText strong{font-size:22px;letter-spacing:-.03em;color:var(--dark)}
.showcaseBrandText span{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#6f984a}
.showcaseBrandText small{font-size:11px;color:#718076}
@media(max-width:900px){.navBrandText{display:none}.heroLogoFrame{margin-bottom:12px}.brandTextBlock strong{font-size:24px}.brandTextBlock small{font-size:12px}}
`;

writeFileSync('src/main.jsx',main,'utf8');
writeFileSync('src/styles.css',css,'utf8');
console.log('Restored Your Garden Tools v6 with readable company text outside the logo.');
