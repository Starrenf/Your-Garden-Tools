import {readFileSync,writeFileSync} from 'node:fs';
const file='src/main.jsx';
let code=readFileSync(file,'utf8');
const importStatement="import './glass-theme.css';";
if(!code.includes(importStatement)) {
  // Keep the glass stylesheet last, after module and invoice styles.
  code += '\n'+importStatement+'\n';
  writeFileSync(file,code,'utf8');
}
console.log('Glass UI enabled for public website, login, workshop and invoice dialogs.');
