import {readFileSync,writeFileSync} from 'node:fs';

// v24: alleen de publieke website. Inlog, werkplaats, boekhouding,
// onderhoudsschakelaar en alle Supabase-koppelingen zijn verwijderd.
// Er worden geen gegevens meer opgeslagen.

const file='src/main.jsx';
const src=readFileSync(file,'utf8');

const take=(startMarker,endMarker)=>{
  const a=src.indexOf(startMarker);
  const b=src.indexOf(endMarker,a+1);
  if(a<0||b<0)throw new Error(`v24: blok "${startMarker}" niet gevonden`);
  return src.slice(a,b);
};

const icons=take('const icons=','const seed=');
let pub=take('function Public(','function Login(');

// Knoppen naar de bedrijfsomgeving verwijderen.
const navButton="<button onClick={()=>{setMenuOpen(false);enter()}}>Werkplaats</button>";
const footButton="<button onClick={enter}>Naar bedrijfsomgeving</button>";
if(!pub.includes(navButton)||!pub.includes(footButton))throw new Error('v24: knoppen naar bedrijfsomgeving niet gevonden');
pub=pub.replace(navButton,'').replace(footButton,'').replace('function Public({enter})','function Public()');
if(/enter\b/.test(pub))throw new Error('v24: Public verwijst nog naar de bedrijfsomgeving');

const main=`import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import './glass-theme.css';
import './toro-hero.css';

${icons}
${pub}
createRoot(document.getElementById('root')).render(<Public/>);
`;

writeFileSync(file,main,'utf8');
console.log('v24: alleen publieke website; login, werkplaats en Supabase verwijderd');
