import { readFileSync, writeFileSync } from 'node:fs';

const mainPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let jsx = readFileSync(mainPath, 'utf8');
let css = readFileSync(cssPath, 'utf8');
const anchor = '<span>© 2026 Your Garden Tools · Bunde</span>';
if (!jsx.includes(anchor)) {
  throw new Error('Kan Ordinis niet toevoegen: footer is gewijzigd; build gestopt om een stille regressie te voorkomen.');
}
const logo = '<svg viewBox="0 0 40 46" width="30" height="34" fill="none" aria-hidden="true"><path d="M20 1.7 35.4 10v25.8L20 44.2 4.6 35.8V10L20 1.7Z" fill="#071C34" stroke="#178BFF" strokeWidth="1.5"/><path d="M20 6.4 31 12.3v5.2L20 23.4 9 17.5v-5.2L20 6.4Zm0 12.5 11 5.9V30L20 35.9 9 30v-5.2l11-5.9Z" fill="#116EEB" fillOpacity=".55" stroke="#34D6EF"/><path d="M14 13.8h12M14 27h12" stroke="#B9ECFF" strokeLinecap="round"/></svg>';
const credit = '<a className="ordinis-footer-credit" href="https://ordinissoftware.eu/" target="_blank" rel="noopener noreferrer" aria-label="Website gerealiseerd door Ordinis Software (opent in nieuw tabblad)"><span className="ordinis-footer-logo">'+logo+'</span><span className="ordinis-footer-copy"><small>Website gerealiseerd door</small><strong>ORDINIS <span>SOFTWARE</span></strong></span><span aria-hidden="true">↗</span></a>';
// Patch is intentionally idempotent, with no access to the workshop's UI.
if (!jsx.includes('className="ordinis-footer-credit"')) {
  jsx = jsx.replace(anchor, anchor + credit);
}
if (!css.includes('.ordinis-footer-credit{')) {
  css += `
/* Ordinis attribution on the public website footer */
.public footer .ordinis-footer-credit{display:inline-flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid #d9e3e6;border-radius:12px;background:#f3f8fa;color:#102638;text-decoration:none;transition:background .18s ease}
.public footer .ordinis-footer-credit:hover,.public footer .ordinis-footer-credit:focus-visible{background:#e2eef5;outline-offset:3px}
.ordinis-footer-copy{display:flex;flex-direction:column;gap:3px;line-height:1.15}
.ordinis-footer-copy small{font-size:10px;color:#647985}
.ordinis-footer-copy strong{font-size:13px;letter-spacing:.08em;color:#0d2845}
.ordinis-footer-copy strong span{font-size:10px;color:#167ab9}
.ordinis-footer-logo{display:inline-flex;align-items:center}
@media(max-width:760px){.public footer .ordinis-footer-credit{margin:10px 0}}
`;
}
writeFileSync(mainPath, jsx, 'utf8');
writeFileSync(cssPath, css, 'utf8');
console.log('Ordinis credit integrated into generated public footer.');
