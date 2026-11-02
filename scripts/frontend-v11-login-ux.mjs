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

let css = readFileSync('src/styles.css', 'utf8');
css += `\n.passwordInputWrap{position:relative;margin-top:6px}.passwordInputWrap input{margin-top:0!important;padding-right:92px}.passwordToggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:#eef4e8;color:#4f7136;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}.passwordToggle:hover{background:#e2eed8}.passwordToggle:focus-visible{outline:2px solid #82b94b;outline-offset:2px}\n`;

writeFileSync('src/main.jsx', main, 'utf8');
writeFileSync('src/styles.css', css, 'utf8');
console.log('Applied v11 login password visibility and clearer auth error.');
