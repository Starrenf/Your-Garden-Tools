import React, {useMemo,useState} from 'react';
import { INVOICE_COMPANY as company } from './invoice-company.js';
import { invoicePdfBlob } from './invoice-pdf.js';
import { createInvoiceDraft, saveFinalInvoicePdf, invoicePdfFromStorage, sendFinalInvoice } from './gardentools-api.js';
import './invoice-ui.css';

const eur = n => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(n||0));
const displayDate = d => d ? new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('nl-NL') : '-';
const todayPlus = days => { const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10); };
const emptyLine = () => ({description:'',quantity:1,unitPrice:0,vatRate:21,type:'other'});
const companyMissing = ['chamberOfCommerce','vatNumber','iban'].filter(k=>!company[k]);
const fileName = inv => 'Factuur-'+String(inv.number).replace(/[^0-9A-Za-z_-]/g,'')+'.pdf';

async function retrievePdf(inv) {
  if(inv.pdfPath) return invoicePdfFromStorage(inv.pdfPath);
  return invoicePdfBlob(inv);
}
function downloadBlob(blob,name) {
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),30000);
}
function viewBlob(blob,tab) {
  const u=URL.createObjectURL(blob);
  if(tab)tab.location.href=u;
  else window.open(u,'_blank','noopener,noreferrer');
  setTimeout(()=>URL.revokeObjectURL(u),90000);
}
function InvoiceComposer({data,close,saved}) {
  const [customerId,setCustomerId]=useState(data.customers[0]?.id||'');
  const [jobId,setJobId]=useState('');
  const [dueDate,setDueDate]=useState(todayPlus(14));
  const [lines,setLines]=useState([emptyLine()]);
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  const customerJobs=data.jobs.filter(j=>j.customerId===customerId);
  const chooseJob=id=>{
    setJobId(id);
    const j=data.jobs.find(x=>x.id===id);
    if(j){
      const next=[...(j.labor||[]).map(x=>({...x,unitPrice:x.price,quantity:x.qty,vatRate:21,type:'labor'})),
        ...(j.parts||[]).map(x=>({...x,unitPrice:x.price,quantity:x.qty,vatRate:21,type:'part'}))];
      if(next.length)setLines(next);
      else setLines([{...emptyLine(),description:j.title||'Werkzaamheden'}]);
    }
  };
  const edit=(i,key,value)=>setLines(prev=>prev.map((x,j)=>j===i?{...x,[key]:value}:x));
  const sub=lines.reduce((s,l)=>s+Number(l.quantity||0)*Number(l.unitPrice||0),0);
  const vat=lines.reduce((s,l)=>s+Math.round(Number(l.quantity||0)*Number(l.unitPrice||0)*Number(l.vatRate||0))/100,0);
  const submit=async e=>{
    e.preventDefault();setError('');
    if(!customerId){setError('Registreer eerst een klant.');return;}
    if(lines.some(l=>!String(l.description).trim()||Number(l.quantity)<=0||Number(l.unitPrice)<0)){
      setError('Vul alle factuurregels met een omschrijving, hoeveelheid en geldige prijs in.');return;
    }
    setSaving(true);
    try{
      const created=await createInvoiceDraft({customerId,jobId,dueDate,lines});
      saved(created);
    }catch(err){setError(err.message||String(err));setSaving(false);}
  };
  return <div className="invOverlay" role="dialog" aria-modal="true" aria-labelledby="invFormTitle">
    <div className="invModal invForm">
      <div className="invModalTop"><div><small>NIEUWE FACTUUR</small><h2 id="invFormTitle">Factuur opstellen</h2><p>Opslaan als concept. Factuurnummer komt automatisch uit Supabase.</p></div><button type="button" onClick={close} aria-label="Sluiten">×</button></div>
      <form onSubmit={submit}>
        <div className="invFormGrid">
          <label>Klant<select required value={customerId} onChange={e=>{setCustomerId(e.target.value);setJobId('');setLines([emptyLine()])}}>
            {data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
          <label>Werkopdracht (optioneel)<select value={jobId} onChange={e=>chooseJob(e.target.value)}>
            <option value="">Zonder werkopdracht</option>
            {customerJobs.map(j=><option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}
          </select></label>
          <label>Vervaldatum<input type="date" required value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
        </div>
        <h3>Factuurregels</h3>
        <div className="invLineEditor">{lines.map((line,i)=><div className="invLine" key={i}>
          <label className="description">Omschrijving<input required value={line.description} onChange={e=>edit(i,'description',e.target.value)}/></label>
          <label>Aantal<input type="number" required min=".01" step=".01" value={line.quantity} onChange={e=>edit(i,'quantity',e.target.value)}/></label>
          <label>Prijs excl. btw<input type="number" required min="0" step=".01" value={line.unitPrice} onChange={e=>edit(i,'unitPrice',e.target.value)}/></label>
          <label>Btw<select value={line.vatRate} onChange={e=>edit(i,'vatRate',e.target.value)}><option value="21">21%</option><option value="9">9%</option><option value="0">0%</option></select></label>
          <button type="button" className="invLineDelete" disabled={lines.length===1} title="Regel verwijderen" onClick={()=>setLines(x=>x.filter((_,j)=>j!==i))}>×</button>
        </div>)}</div>
        <button type="button" className="invSoft" onClick={()=>setLines(x=>[...x,emptyLine()])}>+ Factuurregel toevoegen</button>
        <div className="invTotals"><span>Subtotaal <strong>{eur(sub)}</strong></span><span>Btw <strong>{eur(vat)}</strong></span><span className="grand">Totaal <strong>{eur(sub+vat)}</strong></span></div>
        {error&&<p className="invError">{error}</p>}
        <div className="invActions"><button type="button" className="invSoft" onClick={close}>Annuleren</button><button disabled={saving} className="invPrimary">{saving?'Opslaan…':'Conceptfactuur opslaan'}</button></div>
      </form>
    </div>
  </div>;
}
function InvoicePreview({invoice,readOnly,onClose,onUpdated}) {
  const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [sendingTo,setSendingTo]=useState(invoice.customerEmail||'');
  const [showSend,setShowSend]=useState(false);
  const action=async (name,callback)=>{
    setBusy(name);setError('');setNotice('');
    try {await callback()}catch(err){setError(err.message||String(err))}finally{setBusy('')}
  };
  const openPdf=()=>{
    const tab=window.open('','_blank');
    if(tab)tab.document.write('<p style="font-family:Arial;padding:30px">PDF wordt geladen…</p>');
    action('open',async()=>{
      try{const blob=await retrievePdf(invoice);viewBlob(blob,tab);}
      catch(e){if(tab)tab.close();throw e;}
    });
  };
  const downloadPdf=()=>action('download',async()=>downloadBlob(await retrievePdf(invoice),fileName(invoice)));
  const finalize=()=>action('final',async()=>{
    if(!window.confirm('Factuur '+invoice.number+' definitief maken? De PDF wordt vastgelegd. Controleer eerst alle gegevens.'))return;
    const blob=await invoicePdfBlob({...invoice,status:'Definitief'},{asFinal:true});
    const updated=await saveFinalInvoicePdf(invoice,blob);
    onUpdated(updated);setNotice('Definitieve PDF veilig opgeslagen in Supabase.');
  });
  const send=()=>action('send',async()=>{
    if(invoice.status==='Concept'||!invoice.pdfPath)throw new Error('Maak de factuur eerst definitief.');
    if(companyMissing.length)throw new Error('Vul eerst het KvK-nummer, btw-nummer en IBAN van Your Garden Tools in voordat je een factuur naar een klant verstuurt.');
    if(!sendingTo||sendingTo.toLowerCase()!==String(invoice.customerEmail||'').toLowerCase())throw new Error('E-mailadres wijkt af van de opgeslagen factuur. Controleer het klantadres.');
    if(!window.confirm('Factuur '+invoice.number+' naar '+sendingTo+' versturen?'))return;
    const result=await sendFinalInvoice(invoice.id);
    onUpdated({...invoice,status:'Verzonden',sentAt:new Date().toISOString()});
    setNotice('Factuur verzonden. Bericht-ID: '+(result?.messageId||'bevestigd'));
    setShowSend(false);
  });
  const mailFallback=()=>action('mail',async()=>{
    const blob=await retrievePdf(invoice);
    downloadBlob(blob,fileName(invoice));
    const subject=encodeURIComponent('Factuur '+invoice.number+' – '+company.name);
    const body=encodeURIComponent('Beste '+invoice.customer+',\n\nBijgevoegd vindt u factuur '+invoice.number+' ter waarde van '+eur(invoice.amount)+'.\n\nMet vriendelijke groet,\n'+company.contact+'\n'+company.name);
    window.location.href='mailto:'+encodeURIComponent(sendingTo)+'?subject='+subject+'&body='+body;
    setNotice('De PDF is gedownload en je e-mailprogramma is geopend. Voeg het PDF-bestand zelf toe en verzend. Dit wordt NIET automatisch als verzonden geregistreerd.');
  });
  return <div className="invOverlay" role="dialog" aria-modal="true" aria-label={'Factuur '+invoice.number}>
    <div className="invModal invPreviewModal">
      <div className="invModalTop"><div><small>FACTUUR {invoice.number}</small><h2>Factuur bekijken</h2><p>Status: <strong>{invoice.status}</strong> · {displayDate(invoice.date)}</p></div><button type="button" aria-label="Sluiten" onClick={onClose}>×</button></div>
      <div className="invPaper">
        <div className="invPaperHead"><img src={company.logo} alt={company.name}/><div><b>{company.name}</b><span>{company.address}</span><span>{company.postalCode} {company.city}</span><span>{company.phone} / {company.mobile}</span><span>{company.email}</span></div></div>
        <div className="invPaperTop"><div><h2>FACTUUR</h2>{invoice.status==='Concept'&&<em>CONCEPT — NIET VERZENDEN</em>}<div className="invCustomer"><small>FACTUUR AAN</small>{invoice.customerCompanyName&&<strong>{invoice.customerCompanyName}</strong>}<strong>{invoice.customer}</strong><span>{[invoice.customerStreet,invoice.customerHouseNumber].filter(Boolean).join(' ')}</span><span>{invoice.customerPostalCode} {invoice.customerCity}</span><span>{invoice.customerEmail}</span></div></div><div><span>Factuurnummer <b>{invoice.number}</b></span><span>Factuurdatum <b>{displayDate(invoice.date)}</b></span><span>Vervaldatum <b>{displayDate(invoice.dueDate)}</b></span></div></div>
        <div className="invPrintTable"><table><thead><tr><th>Omschrijving</th><th>Aantal</th><th>Prijs</th><th>Btw</th><th>Totaal</th></tr></thead><tbody>
          {(invoice.lines||[]).map((r,i)=><tr key={r.id||i}><td>{r.description}</td><td>{r.quantity}</td><td>{eur(r.unitPrice)}</td><td>{r.vatRate}%</td><td>{eur(r.lineTotal)}</td></tr>)}
        </tbody></table></div>
        <div className="invPaperTotals"><div>Subtotaal <b>{eur(invoice.subtotal)}</b></div><div>Btw <b>{eur(invoice.vatTotal)}</b></div><div className="grand">Totaal <b>{eur(invoice.amount)}</b></div></div>
        <div className="invPaperFooter"><span>Betaling binnen {company.paymentDays} dagen onder vermelding van {invoice.number}.</span>{company.iban&&<span>IBAN: {company.iban}</span>}{company.chamberOfCommerce&&<span>KvK: {company.chamberOfCommerce}</span>}{company.vatNumber&&<span>BTW: {company.vatNumber}</span>}</div>
      </div>
      {companyMissing.length>0&&<div className="invWarning">Let op: KvK-nummer, btw-nummer en/of IBAN zijn nog niet ingevuld. Controleer de bedrijfsgegevens vóór verzending aan een klant.</div>}
      {error&&<div className="invError">{error}</div>}{notice&&<div className="invSuccess">{notice}</div>}
      {showSend&&<div className="invSendBox">
        <label>E-mailadres ontvanger<input type="email" value={sendingTo} onChange={e=>setSendingTo(e.target.value)} placeholder="klant@example.nl" /></label>
        <div className="invSendActions"><button type="button" disabled={!!busy||!sendingTo} onClick={send} className="invPrimary">{busy==='send'?'Verzenden…':'Automatisch versturen'}</button>
        <button type="button" className="invSoft" disabled={!!busy||!sendingTo} onClick={mailFallback}>Via eigen e-mailprogramma</button></div>
        <small>Automatisch versturen werkt zodra de zakelijke maildienst is ingesteld. Bij eigen e-mail moet je de gedownloade PDF zelf toevoegen. Alleen bevestigde automatische verzending wordt als verzonden vastgelegd.</small>
      </div>}
      <div className="invActions">
        <button type="button" className="invSoft" disabled={!!busy} onClick={openPdf}>↗ PDF openen</button>
        <button type="button" className="invSoft" disabled={!!busy} onClick={downloadPdf}>↓ PDF downloaden</button>
        {!readOnly&&invoice.status==='Concept'&&<button type="button" className="invPrimary" disabled={!!busy} onClick={finalize}>{busy==='final'?'Opslaan…':'✓ Definitief maken'}</button>}
        {!readOnly&&invoice.status!=='Concept'&&<button type="button" className="invPrimary" disabled={!!busy||invoice.status==='Verzonden'||invoice.status==='Betaald'} onClick={()=>setShowSend(v=>!v)}>✉ {invoice.status==='Verzonden'?'Al verzonden':'Versturen'}</button>}
        <button type="button" className="invSoft" onClick={onClose}>Sluiten</button>
      </div>
    </div>
  </div>;
}
export default function Invoices({data,setData,showCreateButton=true}) {
  const [query,setQuery]=useState(''),[composer,setComposer]=useState(false),[selected,setSelected]=useState(null);
  const readOnly=typeof setData!=='function';
  const rows=useMemo(()=>data.invoices.filter(i=>(i.number+' '+i.customer+' '+i.status).toLowerCase().includes(query.toLowerCase())),[data.invoices,query]);
  const sync=updated=>{
    if(!readOnly)setData(old=>({...old,invoices:old.invoices.map(x=>x.id===updated.id?updated:x)}));
    setSelected(updated);
  };
  return <section className="invHub">
    <div className="invHubTop"><div><h2>Facturen</h2><p>Bekijk facturen, download PDF-bestanden en verstuur na controle.</p></div>
    {!readOnly&&showCreateButton&&<button type="button" className="invPrimary" onClick={()=>setComposer(true)}>+ Nieuwe factuur</button>}</div>
    <label className="invSearch"><span>Zoeken</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek op factuurnummer, klant of status…"/></label>
    <div className="invTableOuter"><table className="invTable"><thead><tr><th>Factuurnummer</th><th>Klant</th><th>Datum</th><th>Bedrag</th><th>Status</th><th>Actie</th></tr></thead><tbody>
      {rows.map(i=><tr key={i.id}><td><b>{i.number}</b></td><td>{i.customer}</td><td>{displayDate(i.date)}</td><td><b>{eur(i.amount)}</b></td><td><span className={'invStatus '+(i.status==='Concept'?'draft':'')}>{i.status}</span></td><td><button type="button" className="invOpen" onClick={()=>setSelected(i)}>Bekijken ›</button></td></tr>)}
      {!rows.length&&<tr><td colSpan="6" className="invEmpty">Nog geen facturen gevonden.</td></tr>}
    </tbody></table></div>
    {composer&&<InvoiceComposer data={data} close={()=>setComposer(false)} saved={inv=>{
      setData(d=>({...d,invoices:[inv,...d.invoices]}));setComposer(false);setSelected(inv);
    }}/>}
    {selected&&<InvoicePreview key={selected.id+'-'+selected.status} invoice={selected} readOnly={readOnly} onClose={()=>setSelected(null)} onUpdated={sync}/>}
  </section>;
}
