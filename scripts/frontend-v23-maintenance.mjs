import {readFileSync,writeFileSync} from 'node:fs';

const file='src/main.jsx';
let main=readFileSync(file,'utf8');
const publicRoute="return <Public enter={()=>go('/login')}/>;";
const gatedRoute="return <MaintenanceGate><Public enter={()=>go('/login')}/></MaintenanceGate>;";
if(!main.includes(publicRoute))throw new Error('Publieke route is gewijzigd; onderhoudspagina niet ingevoegd');
main=main.replace(publicRoute,gatedRoute);

const nav='<Nav p="radio" page={page} set={setPage} i="radio" t="Werkplaatsradio"/>';
if(!main.includes(nav))throw new Error('Navigatie werkplaats is gewijzigd; afgebroken');
main=main.replace(nav,nav+'{user?.role===\'owner\'&&<Nav p="siteSettings" page={page} set={setPage} i="home" t="Websitebeheer"/>}');

if(!main.includes("radio:'Werkplaatsradio'"))throw new Error('Titelmap ontbreekt');
main=main.replace("radio:'Werkplaatsradio'","radio:'Werkplaatsradio',siteSettings:'Websitebeheer'");

const start=main.indexOf("{page==='radio'&&<Radio ");
if(start<0)throw new Error('Radio werkplaatspagina is gewijzigd');
const end=main.indexOf('/>}',start);
if(end<0||end-start>1200)throw new Error('Einde radio component onvindbaar');
main=main.slice(0,end+3)+" {page==='siteSettings'&&user?.role==='owner'&&<MaintenanceSettings/>}"+main.slice(end+3);

main="import {MaintenanceGate,MaintenanceSettings} from './maintenance-ui.jsx';\n"+main;
writeFileSync(file,main,'utf8');
console.log('v23: publieke onderhoudspagina en eigenaarsscherm Websitebeheer ingeschakeld');
