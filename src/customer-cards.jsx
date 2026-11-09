import React, {useEffect, useMemo, useState} from 'react';
import {createCustomer, updateCustomer} from './gardentools-api.js';
import './customer-cards.css';

const blank = () => ({
  name:'',companyName:'',phone:'',email:'',street:'',houseNumber:'',postalCode:'',city:'',notes:''
});
const toForm = c => ({
  name:c?.name || '', companyName:c?.companyName || '', phone:c?.phone || '',
  email:c?.email || '', street:c?.street || '', houseNumber:c?.houseNumber || '',
  postalCode:c?.postalCode || '', city:c?.city || '', notes:c?.notes || ''
});
const initials = name => String(name || '?').trim().split(/\s+/).slice(0,2).map(p=>p[0] || '').join('').toUpperCase();
const neatDate = value => value ? new Date(value).toLocaleDateString('nl-NL') : '—';
const short = (value, fallback='Niet ingevuld') => String(value || '').trim() || fallback;
const safeSearch = value => String(value || '').toLocaleLowerCase('nl-NL');

function CustomerDrawer({customer,data,onSaved,onClose}) {
  const isNew = !customer;
  const [editing,setEditing] = useState(isNew);
  const [form,setForm] = useState(() => isNew ? blank() : toForm(customer));
  const [tab,setTab] = useState('gegevens');
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{
    const key = event => { if(event.key==='Escape' && !saving)onClose(); };
    document.addEventListener('keydown',key);
    return ()=>document.removeEventListener('keydown',key);
  },[saving,onClose]);
  const machines = (data.machines || []).filter(x=>x.customerId===customer?.id);
  const jobs = (data.jobs || []).filter(x=>x.customerId===customer?.id);
  const setField = (field,value) => setForm(old=>({...old,[field]:value}));
  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setForm(toForm(customer));
  };
  const save = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = isNew ? await createCustomer(form) : await updateCustomer(customer.id,form);
      onSaved(result, isNew);
      setForm(toForm(result));
      setEditing(false);
    } catch(e) {
      setError(e?.message || 'Klantgegevens konden niet worden opgeslagen.');
    } finally {
      setSaving(false);
    }
  };
  return <div className="ccBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)onClose()}}>
    <section className="ccDrawer" role="dialog" aria-modal="true" aria-label={isNew?'Nieuwe klant aanmaken':'Klantkaart van '+customer.name}>
      <header className="ccDrawerHead">
        <div className="ccDrawerIdentity">
          <span className="ccAvatar ccAvatarLarge" aria-hidden="true">{initials(customer?.name || 'Nieuwe klant')}</span>
          <div><small>KLANTDOSSIER {customer?.customerNumber && '· '+customer.customerNumber}</small><h2>{isNew?'Nieuwe klant':customer.name}</h2>
            <p>{isNew?'Vul de gegevens in. Na opslaan staat de klant direct in Supabase.':(customer.companyName || [customer.postalCode,customer.city].filter(Boolean).join(' ') || 'Persoonlijk klantdossier')}</p>
          </div>
        </div>
        <button className="ccClose" type="button" aria-label="Klantkaart sluiten" onClick={onClose}>×</button>
      </header>
      {!isNew && !editing && <nav className="ccTabs" aria-label="Onderdelen klantdossier">
        {[['gegevens','Klantgegevens'],['machines','Machines ('+machines.length+')'],['opdrachten','Opdrachten ('+jobs.length+')']].map(([key,label])=>
          <button type="button" key={key} className={tab===key?'selected':''} onClick={()=>setTab(key)} aria-current={tab===key?'page':undefined}>{label}</button>)}
      </nav>}
      <div className="ccDrawerBody">
        {editing ? <form className="ccForm" onSubmit={save}>
          <p className="ccHelp">Alleen de naam is verplicht. Overige gegevens kunnen later worden aangevuld.</p>
          <div className="ccFieldGrid">
            <label className="ccWide">Naam klant <span>*</span><input autoFocus required autoComplete="name" maxLength={200} value={form.name} onChange={e=>setField('name',e.target.value)} placeholder="Voor- en achternaam"/></label>
            <label className="ccWide">Bedrijfsnaam (optioneel)<input maxLength={200} value={form.companyName} onChange={e=>setField('companyName',e.target.value)} placeholder="Bij zakelijke klant"/></label>
            <label>Telefoon<input type="tel" autoComplete="tel" maxLength={70} value={form.phone} onChange={e=>setField('phone',e.target.value)} placeholder="06 ..."/></label>
            <label>E-mailadres<input type="email" autoComplete="email" maxLength={200} value={form.email} onChange={e=>setField('email',e.target.value)} placeholder="klant@voorbeeld.nl"/></label>
            <label className="ccWide">Straat<input autoComplete="address-line1" maxLength={200} value={form.street} onChange={e=>setField('street',e.target.value)}/></label>
            <label>Huisnummer<input maxLength={25} value={form.houseNumber} onChange={e=>setField('houseNumber',e.target.value)}/></label>
            <label>Postcode<input autoComplete="postal-code" maxLength={20} value={form.postalCode} onChange={e=>setField('postalCode',e.target.value)}/></label>
            <label className="ccWide">Plaats<input autoComplete="address-level2" maxLength={120} value={form.city} onChange={e=>setField('city',e.target.value)}/></label>
            <label className="ccWide">Notities<textarea rows={3} maxLength={4000} value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Bijzonderheden of afspraken"/></label>
          </div>
          {error&&<p className="ccError" role="alert">{error}</p>}
          <div className="ccDrawerActions">
            <button type="button" className="ccSecondary" disabled={saving} onClick={isNew?onClose:cancelEdit}>Annuleren</button>
            <button type="submit" className="ccPrimary" disabled={saving||!form.name.trim()}>{saving?'Opslaan…':'✓ Klant opslaan'}</button>
          </div>
        </form> : tab==='gegevens' ? <>
          <div className="ccSectionHead"><div><h3>Klantgegevens</h3><p>Alle informatie bij elkaar. Klik op Bewerken om gegevens aan te passen.</p></div><button type="button" className="ccPrimary" onClick={()=>{setForm(toForm(customer));setEditing(true)}}>✎ Bewerken</button></div>
          <div className="ccDetailsGrid">
            <div><small>Naam</small><strong>{short(customer.name)}</strong></div>
            <div><small>Bedrijfsnaam</small><strong>{short(customer.companyName)}</strong></div>
            <div><small>Telefoon</small><strong>{customer.phone?<a href={'tel:'+customer.phone.replace(/[^+0-9]/g,'')}>{customer.phone}</a>: 'Niet ingevuld'}</strong></div>
            <div><small>E-mail</small><strong>{customer.email?<a href={'mailto:'+customer.email}>{customer.email}</a>:'Niet ingevuld'}</strong></div>
            <div><small>Adres</small><strong>{short([customer.street,customer.houseNumber].filter(Boolean).join(' '))}</strong></div>
            <div><small>Postcode en plaats</small><strong>{short([customer.postalCode,customer.city].filter(Boolean).join(' '))}</strong></div>
            <div><small>Klant sinds</small><strong>{neatDate(customer.createdAt)}</strong></div>
            <div><small>Klantnummer</small><strong>{short(customer.customerNumber,'—')}</strong></div>
          </div>
          <section className="ccNotes"><h3>Notities</h3><p>{customer.notes || 'Nog geen notities. Via Bewerken kun je deze toevoegen.'}</p></section>
          <div className="ccDrawerActions"><button className="ccSecondary" onClick={onClose}>Terug naar klanten</button></div>
        </> : tab==='machines' ? <>
          <div className="ccSectionHead"><div><h3>Machines van {customer.name}</h3><p>{machines.length} gekoppelde {machines.length===1?'machine':'machines'}</p></div></div>
          {machines.length ? <div className="ccLinkedList">{machines.map(m=><div key={m.id} className="ccLinked"><span className="ccLinkedIcon" aria-hidden="true">⚙</span><div><strong>{[m.brand,m.model].filter(Boolean).join(' ')||m.type||'Machine'}</strong><small>{[m.type,m.serial&&'Serienummer '+m.serial].filter(Boolean).join(' · ')||'Geen verdere gegevens'}</small></div></div>)}</div> : <div className="ccEmpty">Er zijn nog geen machines aan deze klant gekoppeld. Machines registreer je in de module <strong>Machines</strong>.</div>}
        </> : <>
          <div className="ccSectionHead"><div><h3>Opdrachten van {customer.name}</h3><p>{jobs.length} gekoppelde {jobs.length===1?'opdracht':'opdrachten'}</p></div></div>
          {jobs.length ? <div className="ccLinkedList">{jobs.map(j=><div key={j.id} className="ccLinked"><span className="ccLinkedIcon" aria-hidden="true">▤</span><div><strong>{j.number||'Werkopdracht'} · {j.title||'Geen omschrijving'}</strong><small>Status: {j.status||'Onbekend'}{j.created?' · '+neatDate(j.created):''}</small></div></div>)}</div> : <div className="ccEmpty">Er staan nog geen opdrachten bij deze klant. Nieuwe opdrachten maak je aan via <strong>Opdrachten</strong>.</div>}
        </>}
      </div>
    </section>
  </div>;
}

export default function CustomerCards({data,setData}) {
  const [query,setQuery]=useState('');
  const [selectedId,setSelectedId]=useState(null);
  const [adding,setAdding]=useState(false);
  const customers=useMemo(()=>{
    const needle=safeSearch(query).trim();
    return (data.customers||[]).filter(c=>!needle || safeSearch([c.name,c.companyName,c.phone,c.email,c.city,c.customerNumber].join(' ')).includes(needle));
  },[query,data.customers]);
  const selected=(data.customers||[]).find(c=>c.id===selectedId);
  const machinesFor=id=>(data.machines||[]).filter(m=>m.customerId===id).length;
  const jobsFor=id=>(data.jobs||[]).filter(j=>j.customerId===id).length;
  const saved=(result,isNew)=>{
    setData(old=>({...old,customers:isNew?[result,...old.customers]:old.customers.map(c=>c.id===result.id?result:c)}));
    setAdding(false);
    setSelectedId(result.id);
  };
  return <div className="ccPage">
    <div className="ccTopbar">
      <div><span className="ccKicker">KLANTENBESTAND</span><h2>Klantkaarten</h2><p>Open een klantkaart om gegevens, machines en opdrachten te bekijken of te wijzigen.</p></div>
      <button type="button" className="ccPrimary" onClick={()=>{setSelectedId(null);setAdding(true)}}>+ Nieuwe klant</button>
    </div>
    <div className="ccFilters"><label><span className="ccSearchIcon" aria-hidden="true">⌕</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek op naam, bedrijf, e-mail of plaats…" aria-label="Zoeken in klantkaarten"/></label><span>{customers.length} {customers.length===1?'klantkaart':'klantkaarten'}</span></div>
    <div className="ccGrid">
      {customers.map(c=><article className="ccCard" key={c.id}>
        <button type="button" className="ccCardButton" onClick={()=>setSelectedId(c.id)} aria-label={'Open klantkaart van '+c.name}>
          <span className="ccCardHeader"><span className="ccAvatar" aria-hidden="true">{initials(c.name)}</span><span className="ccCardIdentity"><strong>{c.name}</strong><small>{c.companyName||c.customerNumber||'Particuliere klant'}</small></span><span className="ccArrow" aria-hidden="true">↗</span></span>
          <span className="ccCardInfo"><span><b>⌕</b>{short([c.postalCode,c.city].filter(Boolean).join(' '),'Plaats niet ingevuld')}</span><span><b>☎</b>{short(c.phone,'Geen telefoonnummer')}</span><span><b>✉</b>{short(c.email,'Geen e-mailadres')}</span></span>
          <span className="ccCardFoot"><span>{machinesFor(c.id)} {machinesFor(c.id)===1?'machine':'machines'}</span><span>{jobsFor(c.id)} {jobsFor(c.id)===1?'opdracht':'opdrachten'}</span><strong>Klantkaart openen <span aria-hidden="true">→</span></strong></span>
        </button>
      </article>)}
    </div>
    {!customers.length && <div className="ccNoResults"><h3>{query?'Geen klanten gevonden':'Nog geen klanten geregistreerd'}</h3><p>{query?'Probeer een andere zoekterm.':'Maak je eerste klantkaart aan. De gegevens worden direct opgeslagen in Supabase.'}</p>{query&&<button type="button" className="ccSecondary" onClick={()=>setQuery('')}>Zoeken wissen</button>}</div>}
    {(adding||selected)&&<CustomerDrawer key={selected?.id||'new'} customer={selected} data={data} onSaved={saved} onClose={()=>{setAdding(false);setSelectedId(null)}}/>}
  </div>;
}
