import { readFileSync, writeFileSync } from 'node:fs';

const mainPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let jsx = readFileSync(mainPath, 'utf8');
let css = readFileSync(cssPath, 'utf8');

const originalPublic = 'function Public({enter}){return <div className="public">';
const newPublic = `function Public({enter}){
 const routeFromHash=()=>{const v=window.location.hash.replace(/^#\\/?/,'');return ['diensten','werkwijze','contact'].includes(v)?v:'home'};
 const[page,setPage]=useState(routeFromHash);
 const[menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{const onRoute=()=>{setPage(routeFromHash());setMenuOpen(false);window.scrollTo(0,0)};window.addEventListener('hashchange',onRoute);return()=>window.removeEventListener('hashchange',onRoute)},[]);
 return <div className="public">`;
if (!jsx.includes('const routeFromHash=')) {
 if (!jsx.includes(originalPublic)) throw new Error('Public component anchor not found');
 jsx=jsx.replace(originalPublic,newPublic);
}
const originalHeader='<header className="pubnav"><a href="#top" className="logoFrame" aria-label="Your Garden Tools"><img src="/logo.png" alt="Your Garden Tools logo"/></a><nav><a href="#diensten">Diensten</a><a href="#werkwijze">Werkwijze</a><a href="#contact">Contact</a><button onClick={enter}>Werkplaats</button></nav></header>';
const newHeader=`<header className="pubnav"><a href="#/" className="logoFrame" aria-label="Your Garden Tools - Home"><img src="/logo.png" alt="Your Garden Tools logo"/></a><button type="button" className="public-menu-toggle" aria-label={menuOpen?'Menu sluiten':'Menu openen'} aria-expanded={menuOpen} aria-controls="public-main-menu" onClick={()=>setMenuOpen(x=>!x)}><span></span><span></span><span></span></button><nav id="public-main-menu" className={menuOpen?'public-nav-open':''} aria-label="Hoofdnavigatie"><a className={page==='home'?'active':''} aria-current={page==='home'?'page':undefined} href="#/" onClick={()=>setMenuOpen(false)}>Home</a><a className={page==='diensten'?'active':''} aria-current={page==='diensten'?'page':undefined} href="#/diensten" onClick={()=>setMenuOpen(false)}>Diensten</a><a className={page==='werkwijze'?'active':''} aria-current={page==='werkwijze'?'page':undefined} href="#/werkwijze" onClick={()=>setMenuOpen(false)}>Werkwijze</a><a className={page==='contact'?'active':''} aria-current={page==='contact'?'page':undefined} href="#/contact" onClick={()=>setMenuOpen(false)}>Contact</a><button onClick={()=>{setMenuOpen(false);enter()}}>Werkplaats</button></nav></header>`;
if (!jsx.includes('public-menu-toggle')) {
 const headerPattern=/<header className="pubnav">[\\s\\S]*?<\\/header>/;
 if(!headerPattern.test(jsx))throw new Error('Public navigation header not found');
 jsx=jsx.replace(headerPattern,newHeader);
}
jsx=jsx.replace('<main id="top">','<main id="top" className={"public-view page-"+page}>');
jsx=jsx.replaceAll('href="#diensten"','href="#/diensten"').replaceAll('href="#contact"','href="#/contact"');
if (!jsx.includes('className={"public-view page-"+page}'))throw new Error('Public page routing not inserted');

if(!css.includes('.public-menu-toggle{'))css += `
/* Navigable public pages and accessible mobile menu */
.public-view.page-home #diensten,.public-view.page-home #werkwijze,.public-view.page-home #contact{display:none}
.public-view.page-diensten>section:not(#diensten),.public-view.page-werkwijze>section:not(#werkwijze),.public-view.page-contact>section:not(#contact){display:none}
.public-view:not(.page-home){min-height:calc(100vh - 240px);padding-top:42px}
.public-view:not(.page-home)>.section{padding-top:38px}
.public .pubnav nav a.active{color:#4b8029;font-weight:800;border-bottom:2px solid #88b84a;padding-bottom:4px}
.public-menu-toggle{display:none}
@media(max-width:760px){
 .public .pubnav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between}
 .public-menu-toggle{display:flex;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:11px;background:#fff;border:1px solid #d4dfd0;border-radius:10px;cursor:pointer;flex-shrink:0}
 .public-menu-toggle span{height:2px;width:100%;background:#17251c;border-radius:2px}
 .public .pubnav nav{display:none;position:absolute;top:100%;left:0;right:0;z-index:70;background:#fff;padding:15px 20px 22px;box-shadow:0 18px 25px #16291b20;border-top:1px solid #e0e9dd;flex-direction:column;align-items:stretch;gap:4px}
 .public .pubnav nav.public-nav-open{display:flex}
 .public .pubnav nav a{display:block;padding:14px 12px;color:#203526!important;font-size:16px;border-radius:8px}
 .public .pubnav nav a.active{background:#eff5e9;border:0}
 .public .pubnav nav button{width:100%;margin-top:10px;padding:14px}
 .public-view:not(.page-home){padding-top:12px}
}
`;
writeFileSync(mainPath,jsx,'utf8');
writeFileSync(cssPath,css,'utf8');
console.log('Public multi-page navigation and hamburger menu enabled.');
