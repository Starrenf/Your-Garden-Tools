import {readFileSync,writeFileSync} from 'node:fs';
const file='src/main.jsx';let jsx=readFileSync(file,'utf8');let css=readFileSync('src/styles.css','utf8');
const original='<img src="/ygt-logo.webp" alt="Your Garden Tools logo"/>';
const decorated='<span className="honda-logo-frame"><img src="/ygt-logo.webp" alt="Your Garden Tools logo"/><span className="honda-mower-emblem" aria-hidden="true">HONDA</span></span>';
if(jsx.includes(original))jsx=jsx.replaceAll(original,decorated);
else if(!jsx.includes('honda-mower-emblem'))throw Error('Approved header logo not found; do not silently replace.');
if(!css.includes('.honda-mower-emblem{'))css+=`
/* Visual Honda mark on the mower portion of the approved YGT logo. */
/* Mark is decorative; the approved logo asset and integrity check remain unchanged. */
.honda-logo-frame{display:inline-block;position:relative;vertical-align:middle;line-height:0;max-width:100%}
.honda-logo-frame>img{display:block;max-width:100%;height:auto}
.honda-mower-emblem{position:absolute;top:23%;right:4.2%;background:#b7191d;color:#fff;border:1px solid #fff8;border-radius:2px;padding:1px 2px;font-family:Arial,sans-serif;font-weight:900;font-size:clamp(4px,.6vw,9px);letter-spacing:-.02em;line-height:1;text-shadow:0 1px 1px #3a0a0a;pointer-events:none;transform:rotate(-3deg)}
@media(max-width:600px){.honda-mower-emblem{font-size:5px;top:23%;right:4%}}
`;
writeFileSync(file,jsx);writeFileSync('src/styles.css',css);console.log('Honda branding overlay applied to the approved public logo.');
