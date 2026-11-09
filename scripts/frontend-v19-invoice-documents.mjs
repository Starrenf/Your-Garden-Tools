import {readFileSync,writeFileSync} from 'node:fs';
const file='src/main.jsx';
let main=readFileSync(file,'utf8');
const from=main.indexOf('function Invoices(');
const to=main.indexOf('function Radio(',from);
if(from<0||to<0)throw new Error('Kan bestaand factuuroverzicht niet vinden');
main=main.slice(0,from)+main.slice(to);
const old='<Invoices data={data}/></>';
if(!main.includes(old)||!main.includes('InvoiceEntry customers={data.customers}'))
  throw new Error('Het bestaande factuurformulier is gewijzigd: integratie afgebroken');
main=main.replace(old,'<Invoices data={data} setData={setData} showCreateButton={false}/></>');
main="import Invoices from './invoice-ui.jsx';\n"+main;
writeFileSync(file,main,'utf8');
console.log('v19: Bestaande factuurform behouden, PDF bekijken/downloaden/versturen toegevoegd');
