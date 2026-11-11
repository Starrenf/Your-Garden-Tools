import React,{useCallback,useEffect,useState} from 'react';
import {readMaintenance,updateMaintenance} from './maintenance-api.js';
import './maintenance-ui.css';

const labelDate = value => value ? new Date(value).toLocaleString('nl-NL',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

function PublicMaintenance() {
  return <div className="ygMaintenancePublic">
    <main className="ygMaintenanceCard">
      <img className="ygMaintenanceLogo" src="/ygt-logo.webp" alt="Your Garden Tools" />
      <span className="ygMaintenanceEyebrow">YOUR GARDEN TOOLS · BUNDE</span>
      <div className="ygMaintenanceSymbol" aria-hidden="true">✦</div>
      <h1>We werken aan iets moois.</h1>
      <p>Onze website wordt op dit moment vernieuwd. Voor onderhoud, reparatie of vragen over uw tuinmachine staan we natuurlijk gewoon voor u klaar.</p>
      <div className="ygMaintenanceActions">
        <a className="ygMaintenanceCall" href="tel:+31629575336">Bel Ludo: 06 - 29 57 53 36</a>
        <a className="ygMaintenanceMail" href="mailto:info@yourgardentools.nl">Stuur een e-mail</a>
      </div>
      <div className="ygMaintenanceFoot">
        <span>Ingenopestraat 6 · 6241 BZ Bunde</span>
        <a href="#/login">Medewerkers inloggen</a>
      </div>
    </main>
  </div>;
}

/** Alleen de publieke routes worden vervangen. De login en werkplaats staan buiten deze gate. */
export function MaintenanceGate({children}) {
  const [state,setState]=useState({loading:true,enabled:false});
  const refresh=useCallback(async()=>{
    try {
      const value=await readMaintenance();
      setState({loading:false,enabled:value.enabled});
    } catch(error) {
      // Een statusfout mag de normale openbare site niet permanent blokkeren.
      console.warn('Onderhoudsstatus tijdelijk niet beschikbaar',error);
      setState(old=>({loading:false,enabled:old.enabled}));
    }
  },[]);
  useEffect(()=>{
    refresh();
    const focus=()=>refresh();
    const visible=()=>{if(document.visibilityState==='visible')refresh()};
    const timer=setInterval(refresh,30000);
    window.addEventListener('focus',focus);
    document.addEventListener('visibilitychange',visible);
    return()=>{clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visible)};
  },[refresh]);
  useEffect(()=>{
    if(!state.enabled)return;
    const previousTitle=document.title;
    document.title='Tijdelijk in onderhoud | Your Garden Tools';
    return()=>{document.title=previousTitle};
  },[state.enabled]);
  if(state.loading)return <div className="ygMaintenanceLoading" role="status">Website laden…</div>;
  return state.enabled?<PublicMaintenance/>:children;
}

export function MaintenanceSettings(){
  const [status,setStatus]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const refresh=useCallback(async()=>{
    setError('');
    try {setStatus(await readMaintenance())}
    catch(e){setError(e.message||'De onderhoudsstatus kon niet worden opgehaald.')}
    finally{setLoading(false)}
  },[]);
  useEffect(()=>{refresh()},[refresh]);
  const toggle=async()=>{
    if(!status||busy)return;
    const next=!status.enabled;
    if(next && !window.confirm('De openbare website wordt vervangen door de onderhoudspagina. De werkplaats en boekhouding blijven bereikbaar. Wil je dit inschakelen?'))return;
    setBusy(true);setError('');setNotice('');
    try {
      const updated=await updateMaintenance(next);
      setStatus(updated);
      setNotice(updated.enabled?'Onderhoudsstand staat AAN. Bezoekers zien nu de onderhoudspagina.':'Onderhoudsstand staat UIT. De website is weer openbaar.');
    }catch(e){setError(e.message||'Wijzigen is niet gelukt.');}
    finally{setBusy(false)}
  };
  return <section className="ygMaintenanceSettings">
    <div className="ygMaintenanceSettingsHeader">
      <span className="ygMaintenanceEyebrow">WEBSITEBEHEER</span>
      <h2>Onderhoudsstand</h2>
      <p>Bepaal of bezoekers de website zien of tijdelijk een onderhoudspagina. Dit werkt direct, zonder Vercel-deployment of aanpassing bij KPN.</p>
    </div>
    <div className="ygMaintenanceStatusCard">
      <div className="ygMaintenanceStatusTop">
        <div className="ygMaintenanceStatusInfo">
          <span className={'ygMaintenanceStatusDot '+(status?.enabled?'on':'off')} aria-hidden="true"/>
          <div>
            <strong>{loading?'Status ophalen…':status?.enabled?'Website tijdelijk offline':'Website online'}</strong>
            <small>{status?.enabled?'Bezoekers zien de onderhoudspagina.':'Bezoekers zien de normale website.'}</small>
          </div>
        </div>
        <button type="button" className={'ygMaintenanceSwitch '+(status?.enabled?'isOn':'')}
          role="switch" aria-label="Onderhoudsstand website" aria-checked={Boolean(status?.enabled)}
          disabled={loading||busy||!status} onClick={toggle}>
          <span className="ygMaintenanceSwitchThumb"/>
        </button>
      </div>
      <div className="ygMaintenanceStatusBottom">
        <span>Onderhoudsstand: <b>{status?.enabled?'AAN':'UIT'}</b></span>
        <span>Laatste wijziging: <b>{labelDate(status?.updatedAt)}</b></span>
      </div>
    </div>
    {error&&<div className="ygMaintenanceError" role="alert">{error} <button type="button" onClick={refresh}>Opnieuw proberen</button></div>}
    {notice&&<div className="ygMaintenanceSuccess" role="status">{notice}</div>}
    <div className="ygMaintenanceHelp">
      <h3>Wat verandert er?</h3>
      <div><span>✓</span><p><strong>Publieke website:</strong> wordt bij onderhoud AAN vervangen door een nette pagina met telefoonnummer en e-mailadres.</p></div>
      <div><span>✓</span><p><strong>Werkplaats en boekhouding:</strong> blijven bereikbaar via de eigen inlogroute. Klanten, opdrachten en facturen blijven opgeslagen in Supabase.</p></div>
      <div><span>✓</span><p><strong>Weer online:</strong> zet de schakelaar UIT; bezoekers zien binnen maximaal circa 30 seconden de normale website, of direct na verversen.</p></div>
      <div><span>i</span><p><strong>Let op:</strong> de onderhoudspagina verbergt de openbare interface, maar is geen beveiligingsmaatregel voor eerder gepubliceerde bestanden.</p></div>
    </div>
    <div className="ygMaintenanceSettingsLinks">
      <a href="/" target="_blank" rel="noreferrer">Bekijk website ↗</a>
      <a href="#/login">Inlogpagina openen</a>
    </div>
  </section>;
}
