import React,{useState} from 'react';
import {createInvoice} from './gardentools-api.js';

const eur=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n||0);
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const exampleLines=[
 {description:'Service set HONDA GCV 135/160',quantity:1,unit_price:25.10,vat_rate:21},
 {description:'Motorremkabel',quantity:1,unit_price:16,vat_rate:21},
 {description:'Tandwiel voorwielaandrijving',quantity:2,unit_price:25.45,vat_rate:21},
 {description:'Lager 6201-2RS',quantity:2,unit_price:6.10,vat_rate:21},
 {description:'Smeermiddelen',quantity:.2,unit_price:7.45,vat_rate:21},
 {description:'Reinigingsmiddelen',quantity:2,unit_price:2.09,vat_rate:21},
 {description:'Onderhoudsbeurt benzinemaaier met aandrijving, mes slijpen en balanceren',quantity:1,unit_price:55,vat_rate:21}
];
const initial=()=>({
 number:'TEST-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5),
 customerId:'',customer:'Voorbeeldklant',date:new Date().toISOString().slice(0,10),
 due:new Date(Date.now()+14*864e5).toISOString().slice(0,10),
 machine:'Husqvarna grasmaaier · Honda GCV 170',
 lines:exampleLines.map(x=>({...x}))
});
export default function InvoiceEntry({customers=[],onSaved}){
 const[open,setOpen]=useState(false),[form,setForm]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const subtotal=round(form.lines.reduce((n,x)=>n+round(Number(x.quantity)*Number(x.unit_price)),0));
 const vatTotal=round(form.lines.reduce((n,x)=>n+round(round(Number(x.quantity)*Number(x.unit_price))*Number(x.vat_rate)/100),0));
 const total=round(subtotal+vatTotal);
 const change=(key,val)=>setForm(f=>({...f,[key]:val}));
 const lineChange=(i,key,val)=>setForm(f=>({...f,lines:f.lines.map((x,j)=>i===j?{...x,[key]:val}:x)}));
 const selectCustomer=id=>{let c=customers.find(x=>x.id===id);setForm(f=>({...f,customerId:id,customer:c?.name||f.customer}))};
 const save=async e=>{e.preventDefault();setError('');setBusy(true);try{
  await createInvoice({...form,subtotal,vatTotal,total});
  await onSaved?.();setOpen(false);setForm(initial());
 }catch(err){setError(err.message||'Opslaan mislukt')}finally{setBusy(false)}};
 return <div className="newInvoice">
 <div className="newInvoiceIntro"><div><h3>Facturatie</h3><p>Maak een nieuwe conceptfactuur op basis van een invulformulier. Een geanonimiseerd voorbeeld is alvast ingevuld.</p></div><button className="primaryBtn" onClick={()=>{setForm(initial());setError('');setOpen(true)}}>+ Nieuwe factuur</button></div>
 {open&&<div className="invoiceOverlay" role="presentation"><form className="invoiceEditor" onSubmit={save} aria-label="Nieuwe conceptfactuur">
  <div className="invoiceEditorHead"><div><small>WERKPLAATS · CONCEPTFACTUUR</small><h2>Nieuwe factuur</h2><p>Dit voorbeeld wordt pas opgeslagen als je op Concept opslaan klikt. Er wordt niets verstuurd.</p></div><button type="button" aria-label="Sluiten" onClick={()=>setOpen(false)}>✕</button></div>
  <div className="invoiceFields">
  <label>Factuurnummer<input required value={form.number} onChange={e=>change('number',e.target.value)}/></label>
  <label>Bestaande klant<select value={form.customerId} onChange={e=>selectCustomer(e.target.value)}><option value="">Voorbeeld / handmatig</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>Klantnaam<input required value={form.customer} onChange={e=>change('customer',e.target.value)}/></label>
  <label>Factuurdatum<input required type="date" value={form.date} onChange={e=>change('date',e.target.value)}/></label>
  <label>Vervaldatum<input required type="date" value={form.due} onChange={e=>change('due',e.target.value)}/></label>
  <label>Machine / werkzaamheden<input value={form.machine} onChange={e=>change('machine',e.target.value)}/></label>
  </div>
  <h3>Factuurregels</h3>
  <div className="invoiceLines">{form.lines.map((x,i)=><div className="invoiceLine" key={i}>
    <label className="invoiceDesc">Omschrijving<input required value={x.description} onChange={e=>lineChange(i,'description',e.target.value)}/></label>
    <label>Aantal<input required type="number" min="0.01" step="0.01" value={x.quantity} onChange={e=>lineChange(i,'quantity',e.target.value)}/></label>
    <label>Prijs excl. btw<input required type="number" min="0" step="0.01" value={x.unit_price} onChange={e=>lineChange(i,'unit_price',e.target.value)}/></label>
    <label>Btw<select value={x.vat_rate} onChange={e=>lineChange(i,'vat_rate',e.target.value)}><option value="21">21%</option><option value="9">9%</option><option value="0">0%</option></select></label>
    <button type="button" aria-label="Regel verwijderen" onClick={()=>change('lines',form.lines.filter((_,j)=>j!==i))}>×</button>
  </div>)}</div>
  <button className="invoiceAddLine" type="button" onClick={()=>change('lines',[...form.lines,{description:'',quantity:1,unit_price:0,vat_rate:21}])}>+ Factuurregel toevoegen</button>
  <div className="invoiceTotals"><div><span>Subtotaal</span><b>{eur(subtotal)}</b></div><div><span>Btw</span><b>{eur(vatTotal)}</b></div><div className="invoiceTotal"><span>Totaal</span><strong>{eur(total)}</strong></div></div>
  {error&&<div className="invoiceError" role="alert">{error}</div>}
  <div className="invoiceButtons"><button type="button" onClick={()=>setOpen(false)}>Annuleren</button><button className="primaryBtn" disabled={busy||form.lines.length===0}>{busy?'Opslaan…':'Concept opslaan'}</button></div>
 </form></div>}
 </div>
}
