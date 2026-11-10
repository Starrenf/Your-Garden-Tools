import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const image='public/toro-homepage.webp';
if(!existsSync(image))throw new Error('Toro-foto ontbreekt, hero niet geactiveerd');
const bytes=readFileSync(image);
if(bytes.length!==84512 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Toro-foto integriteit mislukt');
const file='src/main.jsx';
let jsx=readFileSync(file,'utf8');
const start=jsx.indexOf('<div className="heroCard brandPreviewCard">');
const trailing='</div></section><section className="benefits">';
const ending=jsx.indexOf(trailing,start);
if(start===-1||ending===-1)throw new Error('Publieke hero is gewijzigd: afgebroken om de website te beschermen');
const hero=`<div className="heroCard toroHeroCard">
  <figure className="toroHeroFigure">
    <div className="toroHeroImageWrap">
      <img className="toroHeroImage" src="/toro-homepage.webp" width="720" height="813" decoding="async" fetchPriority="high" alt="Rode Toro 60V grasmaaier in een verzorgde, bloemrijke tuin"/>
      <span className="toroHeroTag">TUIN- & PARKMACHINES</span>
    </div>
    <figcaption className="toroHeroCaption"><div><small>VAN OPPHALEN TOT TERUGBEZORGEN</small><strong>Uw tuinmachine in goede handen.</strong></div><span className="toroHeroCheck" aria-hidden="true">✓</span></figcaption>
  </figure>
  <div className="toroHeroContact">
    <div><small>Werkplaats</small><strong>Ingenopestraat 6 · 6241 BZ Bunde</strong></div>
    <div><small>Telefonisch bereikbaar</small><a href="tel:+31629575336">06 - 29 57 53 36</a></div>
    <div><small>E-mail</small><a href="mailto:info@yourgardentools.nl">info@yourgardentools.nl</a></div>
  </div>
</div>`;
jsx=jsx.slice(0,start)+hero+jsx.slice(ending+'</div>'.length);
if(!jsx.includes('className="toroHeroFigure"')||!jsx.includes('<section className="benefits">'))throw Error('Hero patch controle mislukt');
jsx+="\nimport './toro-hero.css';\n";
writeFileSync(file,jsx,'utf8');
console.log('v22: Authentieke Toro-foto in responsive homepage, bestaand logo ongewijzigd');
