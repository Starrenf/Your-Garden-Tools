import { readFileSync, writeFileSync } from 'node:fs';

const mainPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let jsx = readFileSync(mainPath, 'utf8');
let css = readFileSync(cssPath, 'utf8');
const anchor = '<span>© 2026 Your Garden Tools · Bunde</span>';
if (!jsx.includes(anchor)) {
  throw new Error('Kan Ordinis niet toevoegen: footer is gewijzigd; build gestopt om een stille regressie te voorkomen.');
}
const logo = '<img src="/ordinis-logo-full.svg?v=20261120" alt="Ordinis Software" width="180" height="41" loading="lazy" decoding="async"/>';
const credit = '<a className="ordinis-footer-credit" href="https://ordinissoftware.eu/" target="_blank" rel="noopener noreferrer" aria-label="Website gerealiseerd door Ordinis Software (opent in nieuw tabblad)"><span className="ordinis-footer-copy"><small>Website gerealiseerd door</small></span><span className="ordinis-footer-logo">'+logo+'</span><span aria-hidden="true">↗</span></a>';
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
.ordinis-footer-logo{display:inline-flex;align-items:center}.ordinis-footer-logo img{display:block;width:180px;max-width:42vw;height:auto;object-fit:contain}
@media(max-width:760px){.public footer .ordinis-footer-credit{margin:10px 0}}
`;
}
writeFileSync(mainPath, jsx, 'utf8');
writeFileSync(cssPath, css, 'utf8');
console.log('Ordinis credit integrated into generated public footer.');
