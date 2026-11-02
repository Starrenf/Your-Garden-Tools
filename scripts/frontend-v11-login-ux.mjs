import { readFileSync, writeFileSync } from 'node:fs';

let main = readFileSync('src/main.jsx', 'utf8');

const oldState = "function Login({onLogin,back,configured}){const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);";
const newState = "function Login({onLogin,back,configured}){const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[showPassword,setShowPassword]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);";
if (!main.includes(oldState)) throw new Error('Login state anchor not found');
main = main.replace(oldState, newState);

const oldCatch = "catch(err){setError(err.message||'Inloggen is mislukt.')}finally{setBusy(false)}};";
const newCatch = "catch(err){const msg=err.message||'Inloggen is mislukt.';setError(msg==='Invalid login credentials'?'E-mailadres of wachtwoord is onjuist, of het account bestaat nog niet in Supabase Auth.':msg)}finally{setBusy(false)}};";
if (!main.includes(oldCatch)) throw new Error('Login catch anchor not found');
main = main.replace(oldCatch, newCatch);

const oldPassword = '<label>Wachtwoord<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>';
const newPassword = '<label>Wachtwoord<div className="passwordInputWrap"><input type={showPassword?\'text\':\'password\'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/><button type="button" className="passwordToggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?\'Wachtwoord verbergen\':\'Wachtwoord tonen\'}>{showPassword?\'Verbergen\':\'Tonen\'}</button></div></label>';
if (!main.includes(oldPassword)) throw new Error('Password field anchor not found');
main = main.replace(oldPassword, newPassword);

const adminAnchor = "function Admin({data,setData,exit,user,logout,openAccounting}){\n";
if (!main.includes(adminAnchor)) throw new Error('Admin user anchor not found');
main = main.replace(adminAnchor, adminAnchor + " const displayName=(user?.name||user?.email?.split('@')[0]||'Gebruiker').trim();\n const firstName=displayName.split(/\\s+/)[0];\n const initials=displayName.split(/\\s+/).filter(Boolean).slice(0,2).map(n=>n[0]?.toUpperCase()).join('')||'GT';\n const hour=new Date().getHours();\n const greeting=hour<12?'Goedemorgen':hour<18?'Goedemiddag':'Goedenavond';\n");

const oldGreeting = "dashboard:'Goedemorgen, Ludo'";
if (!main.includes(oldGreeting)) throw new Error('Dashboard greeting anchor not found');
main = main.replace(oldGreeting, "dashboard:`${greeting}, ${firstName}`");

main = main.replace('<div className="profile"><b>LN</b><span><strong>{user?.name||\'Ludo Neven\'}</strong><small>Werkplaatsmodule</small></span></div>','<div className="profile"><b>{initials}</b><span><strong>{displayName}</strong><small>Werkplaatsmodule</small></span></div>');
main = main.replace('<span className="avatar">LN</span>','<span className="avatar">{initials}</span>');

const oldGateState = "function ForcePasswordChange({user,onChange,logout}){const[currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);";
const newGateState = "function ForcePasswordChange({user,onChange,logout}){const[currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[showCurrent,setShowCurrent]=useState(false),[showNew,setShowNew]=useState(false),[showConfirm,setShowConfirm]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);";
if (!main.includes(oldGateState)) throw new Error('Password gate state anchor not found');
main = main.replace(oldGateState, newGateState);

const gateFields = [
  [
    '<label>Tijdelijk/huidig wachtwoord<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/></label>',
    '<label>Tijdelijk/huidig wachtwoord<div className="passwordInputWrap"><input type={showCurrent?\'text\':\'password\'} autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><button type="button" className="passwordToggle" onClick={()=>setShowCurrent(v=>!v)}>{showCurrent?\'Verbergen\':\'Tonen\'}</button></div></label>'
  ],
  [
    '<label>Nieuw wachtwoord<input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/></label>',
    '<label>Nieuw wachtwoord<div className="passwordInputWrap"><input type={showNew?\'text\':\'password\'} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><button type="button" className="passwordToggle" onClick={()=>setShowNew(v=>!v)}>{showNew?\'Verbergen\':\'Tonen\'}</button></div></label>'
  ],
  [
    '<label>Herhaal nieuw wachtwoord<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/></label>',
    '<label>Herhaal nieuw wachtwoord<div className="passwordInputWrap"><input type={showConfirm?\'text\':\'password\'} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/><button type="button" className="passwordToggle" onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?\'Verbergen\':\'Tonen\'}</button></div></label>'
  ]
];
for (const [from,to] of gateFields) {
  if (!main.includes(from)) throw new Error('Password gate field anchor not found');
  main = main.replace(from,to);
}

let css = readFileSync('src/styles.css', 'utf8');
css += `\n.passwordInputWrap{position:relative;margin-top:6px}.passwordInputWrap input{margin-top:0!important;padding-right:92px}.passwordToggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:#eef4e8;color:#4f7136;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}.passwordToggle:hover{background:#e2eed8}.passwordToggle:focus-visible{outline:2px solid #82b94b;outline-offset:2px}\n`;

writeFileSync('src/main.jsx', main, 'utf8');
writeFileSync('src/styles.css', css, 'utf8');
console.log('Applied v11 user-aware greeting and password visibility controls.');
