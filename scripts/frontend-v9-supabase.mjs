import { readFileSync, writeFileSync } from 'node:fs';

let main = readFileSync('src/main.jsx', 'utf8');

main = main.replace(
  "import './styles.css';",
  "import './styles.css';\nimport {supabaseConfigured,getCurrentSession,onAuthSession,signIn,signOut,getRole,getDisplayName,loadAppData,createCustomer,createJob,updateJobStatus} from './gardentools-api.js';"
);

const appStart = main.indexOf('const DEMO_USERS=');
const publicStart = main.indexOf('function Public');
if (appStart < 0 || publicStart < 0) throw new Error('Could not find v8 App block');

const appBlock = `const routeNow=()=>((location.hash||'#/').replace(/^#/,'')||'/');
const EMPTY_DATA={customers:[],machines:[],jobs:[],invoices:[]};
function App(){
 const[data,setData]=useState(EMPTY_DATA),[route,setRoute]=useState(routeNow),[session,setSession]=useState(null),[authReady,setAuthReady]=useState(false),[loading,setLoading]=useState(false),[loaded,setLoaded]=useState(false),[appError,setAppError]=useState('');
 useEffect(()=>{const f=()=>setRoute(routeNow());addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);
 useEffect(()=>{let alive=true;getCurrentSession().then(s=>{if(alive){setSession(s);setAuthReady(true)}}).catch(e=>{if(alive){setAppError(e.message||String(e));setAuthReady(true)}});const stop=onAuthSession(s=>{if(alive){setSession(s);setAuthReady(true)}});return()=>{alive=false;stop()}},[]);
 const role=getRole(session),appUser=session?{name:getDisplayName(session),role,email:session.user.email}:null;
 const go=p=>location.hash=p;
 const refresh=async()=>{if(!session||!role){setData(EMPTY_DATA);setLoaded(false);return}setLoading(true);setAppError('');try{setData(await loadAppData(role));setLoaded(true)}catch(e){setAppError(e.message||String(e))}finally{setLoading(false)}};
 useEffect(()=>{refresh()},[session?.user?.id,role]);
 const login=async(email,password)=>{const s=await signIn(email,password);const r=getRole(s);if(!r){await signOut();throw new Error('Deze gebruiker heeft nog geen applicatierol. Ken in Supabase app_metadata.role toe: owner, workshop of accountant.')}setSession(s);go(r==='accountant'?'/boekhouding':'/werkplaats')};
 const logout=async()=>{await signOut();setSession(null);setData(EMPTY_DATA);setLoaded(false);go('/login')};
 if(!authReady)return <ModuleState title="Bedrijfsomgeving laden" text="Authenticatie wordt gecontroleerd…"/>;
 if(appError&&session&&!loading)return <ModuleState title="Kan gegevens niet laden" text={appError} action={refresh} actionLabel="Opnieuw proberen" secondary={logout} secondaryLabel="Uitloggen"/>;
 if(route.startsWith('/login'))return <Login onLogin={login} back={()=>go('/')} configured={supabaseConfigured}/>;
 if(route.startsWith('/boekhouding'))return session?(loading&&!loaded?<ModuleState title="Facturen laden" text="Gegevens worden veilig uit Supabase opgehaald…"/>:<Accounting data={data} user={appUser} logout={logout} openWorkshop={()=>go('/werkplaats')}/>):<Login onLogin={login} back={()=>go('/')} configured={supabaseConfigured}/>;
 if(route.startsWith('/werkplaats')){if(!session)return <Login onLogin={login} back={()=>go('/')} configured={supabaseConfigured}/>;if(role==='accountant')return loading&&!loaded?<ModuleState title="Facturen laden" text="Gegevens worden veilig uit Supabase opgehaald…"/>:<Accounting data={data} user={appUser} logout={logout}/>;return loading&&!loaded?<ModuleState title="Werkplaats laden" text="Klanten, machines en opdrachten worden uit Supabase opgehaald…"/>:<Admin data={data} setData={setData} user={appUser} exit={()=>go('/')} logout={logout} openAccounting={()=>go('/boekhouding')}/>}
 return <Public enter={()=>go('/login')}/>;
}
function ModuleState({title,text,action,actionLabel,secondary,secondaryLabel}){return <div className="moduleState"><img src="/logo.jpg" alt="Your Garden Tools"/><span>BEDRIJFSOMGEVING</span><h1>{title}</h1><p>{text}</p><div>{action&&<button className="primaryBtn" onClick={action}>{actionLabel||'Opnieuw'}</button>}{secondary&&<button onClick={secondary}>{secondaryLabel||'Terug'}</button>}</div></div>}

`;
main = main.slice(0, appStart) + appBlock + main.slice(publicStart);

const loginStart = main.indexOf('function Login(');
const accountingStart = main.indexOf('function Accounting(');
if (loginStart < 0 || accountingStart < 0) throw new Error('Could not find Login block');
const loginBlock = `function Login({onLogin,back,configured}){const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{await onLogin(email,password)}catch(err){setError(err.message||'Inloggen is mislukt.')}finally{setBusy(false)}};return <div className="loginShell"><section className="loginIntro"><button onClick={back}>← Algemene website</button><img src="/logo.jpg" alt="Your Garden Tools"/><span>BEDRIJFSOMGEVING</span><h1>Werkplaats en administratie apart van de website.</h1><p>Klantgegevens, opdrachten en facturen staan achter Supabase Auth en Row Level Security. De publieke website blijft volledig los daarvan.</p><div className="moduleCards"><div><b>⌁ Werkplaats</b><small>Klanten · machines · opdrachten · werkbonnen</small></div><div><b>▤ Boekhouding</b><small>Facturen · status · download · export</small></div></div></section><section className="loginPane"><div className="loginCard"><span className="eyebrow">BEVEILIGDE OMGEVING</span><h2>Inloggen</h2><p>{configured?'Log in met het account dat in Supabase Auth is aangemaakt.':'Supabase is nog niet geconfigureerd voor deze omgeving.'}</p><form onSubmit={submit}><label>E-mailadres<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Wachtwoord<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<div className="loginError">{error}</div>}<button className="primaryBtn" disabled={!configured||busy}>{busy?'Inloggen…':'Inloggen →'}</button></form><div className="secureNote"><b>Supabase beveiligd</b><span>Toegang wordt bepaald door de rol owner, workshop of accountant.</span></div></div></section></div>}
`;
main = main.slice(0, loginStart) + loginBlock + main.slice(accountingStart);

main = main.replace(
  `<div className="accountNote"><b>Supabase-ready</b><span>De boekhouder krijgt straks via RLS alleen toegang tot de benodigde factuurgegevens.</span></div>`,
  `<div className="accountNote"><b>Supabase gekoppeld</b><span>De boekhouder ziet via RLS alleen factuurgegevens en krijgt geen toegang tot klanten, machines of opdrachten.</span></div>`
);

const oldStatus = `const setStatus=s=>setData(d=>({...d,jobs:d.jobs.map(x=>x.id===j.id?{...x,status:s}:x)}));const print=`;
const newStatus = `const setStatus=async s=>{try{await updateJobStatus(j.id,s);setData(d=>({...d,jobs:d.jobs.map(x=>x.id===j.id?{...x,status:s}:x)}))}catch(e){alert('Status opslaan mislukt: '+(e.message||e))}};const print=`;
if (!main.includes(oldStatus)) throw new Error('Could not find job status setter');
main = main.replace(oldStatus, newStatus);

const customerStart = main.indexOf('function CustomerModal(');
const jobModalStart = main.indexOf('function JobModal(');
if (customerStart < 0 || jobModalStart < 0) throw new Error('Could not find CustomerModal');
const customerBlock = `function CustomerModal({data,setData,close}){const[f,setF]=useState({name:'',phone:'',email:'',address:'',city:''}),[saving,setSaving]=useState(false);const save=async e=>{e.preventDefault();setSaving(true);try{const customer=await createCustomer(f);setData(d=>({...d,customers:[...d.customers,customer]}));close()}catch(err){alert('Klant opslaan mislukt: '+(err.message||err))}finally{setSaving(false)}};return <Modal title="Nieuwe klant" close={close}><form onSubmit={save}><Field l="Naam" v={f.name} set={v=>setF({...f,name:v})}/><div className="formrow"><Field l="Telefoon" v={f.phone} set={v=>setF({...f,phone:v})}/><Field l="E-mail" v={f.email} set={v=>setF({...f,email:v})}/></div><Field l="Adres" v={f.address} set={v=>setF({...f,address:v})}/><Field l="Plaats" v={f.city} set={v=>setF({...f,city:v})}/><Actions close={close} label={saving?'Opslaan…':'Klant opslaan'} disabled={saving}/></form></Modal>}
`;
main = main.slice(0, customerStart) + customerBlock + main.slice(jobModalStart);

const newJobStart = main.indexOf('function JobModal(');
const modalStart = main.indexOf('const Modal=', newJobStart);
if (newJobStart < 0 || modalStart < 0) throw new Error('Could not find JobModal');
const jobBlock = `function JobModal({data,setData,close}){const[f,setF]=useState({customerId:data.customers[0]?.id||'',machineId:data.machines[0]?.id||'',title:'',complaint:'',due:new Date(Date.now()+7*864e5).toISOString().slice(0,10)}),[saving,setSaving]=useState(false);const machines=data.machines.filter(m=>m.customerId===f.customerId);useEffect(()=>{if(machines[0]&&!machines.some(m=>m.id===f.machineId))setF(x=>({...x,machineId:machines[0].id}))},[f.customerId]);const save=async e=>{e.preventDefault();setSaving(true);try{const job=await createJob(f);setData(d=>({...d,jobs:[job,...d.jobs]}));close()}catch(err){alert('Opdracht opslaan mislukt: '+(err.message||err))}finally{setSaving(false)}};return <Modal title="Nieuwe opdracht" close={close}><form onSubmit={save}><label>Klant<select value={f.customerId} onChange={e=>setF({...f,customerId:e.target.value})}>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Machine<select value={f.machineId} onChange={e=>setF({...f,machineId:e.target.value})}>{machines.map(m=><option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}</select></label><Field l="Omschrijving" v={f.title} set={v=>setF({...f,title:v})}/><label>Klacht / opdracht<textarea value={f.complaint} onChange={e=>setF({...f,complaint:e.target.value})}/></label><Field l="Gepland gereed" type="date" v={f.due} set={v=>setF({...f,due:v})}/><Actions close={close} label={saving?'Aanmaken…':'Opdracht aanmaken'} disabled={saving}/></form></Modal>}
`;
main = main.slice(0, newJobStart) + jobBlock + main.slice(modalStart);

main = main.replace(
  `const Actions=({close,label})=><div className="formactions"><button type="button" onClick={close}>Annuleren</button><button className="primaryBtn">{label}</button></div>;`,
  `const Actions=({close,label,disabled})=><div className="formactions"><button type="button" onClick={close} disabled={disabled}>Annuleren</button><button className="primaryBtn" disabled={disabled}>{label}</button></div>;`
);

let css = readFileSync('src/styles.css', 'utf8');
css += `\n.loginError{border:1px solid #efc4c4;background:#fff1f1;color:#982e2e;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.45}.secureNote{margin-top:20px;border-top:1px solid #e4e9e2;padding-top:15px;display:flex;flex-direction:column}.secureNote b{font-size:11px;color:#4d7133}.secureNote span{font-size:11px;color:#7a857c;margin-top:4px;line-height:1.45}.moduleState{min-height:100vh;background:radial-gradient(circle at 35% 25%,rgba(122,174,72,.18),transparent 32%),#f4f7f1;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:30px}.moduleState img{width:min(420px,75vw);margin-bottom:25px}.moduleState>span{font-size:10px;letter-spacing:.18em;font-weight:800;color:#6d9948}.moduleState h1{font-size:clamp(32px,5vw,54px);margin:10px 0}.moduleState p{max-width:620px;color:#677269;line-height:1.6}.moduleState>div{display:flex;gap:10px;margin-top:14px}.moduleState>div>button:not(.primaryBtn){border:1px solid #d7dfd3;background:white;border-radius:10px;padding:11px 16px;font-weight:700}.primaryBtn:disabled,.formactions button:disabled{opacity:.55;cursor:not-allowed}\n`;

writeFileSync('src/main.jsx', main, 'utf8');
writeFileSync('src/styles.css', css, 'utf8');
console.log('Applied v9 Supabase Auth/data integration.');
