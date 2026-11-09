import {readFileSync,writeFileSync} from 'node:fs';
const file='src/main.jsx';
let source=readFileSync(file,'utf8');
const anchor="<Customers data={data} add={()=>setModal('customer')}/>";
if(!source.includes(anchor))throw new Error('De klantensectie is veranderd: klantkaarten niet automatisch ingebouwd');
source=source.replace(anchor,"<CustomerCards data={data} setData={setData}/>");
source="import CustomerCards from './customer-cards.jsx';\n"+source;
writeFileSync(file,source,'utf8');
console.log('v21: intuïtieve klantkaarten met dossier, zoeken en Supabase-bewerkfunctie actief');
