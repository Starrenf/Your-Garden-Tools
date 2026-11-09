import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { INVOICE_COMPANY as company } from './invoice-company.js';

const money = n => 'EUR ' + Number(n || 0).toFixed(2).replace('.', ',');
const dateNL = d => {
  if (!d) return '-';
  const a = String(d).slice(0,10).split('-');
  return a.length === 3 ? a[2]+'-'+a[1]+'-'+a[0] : String(d);
};
const safe = v => String(v == null ? '' : v).replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-');
const dark = rgb(.1,.17,.13), green = rgb(.32,.53,.22), muted = rgb(.41,.47,.42), line = rgb(.85,.89,.84);
const W=595.28,H=841.89;
function wrap(text, font, size, maxWidth) {
  const words = safe(text).split(/\s+/).filter(Boolean), lines=[];
  let current='';
  for (const word of words) {
    const next = current ? current+' '+word : word;
    if (font.widthOfTextAtSize(next,size) <= maxWidth || !current) current=next;
    else {lines.push(current);current=word;}
  }
  if(current)lines.push(current);
  return lines.length?lines:[''];
}
async function fetchLogo(pdf) {
  try {
    const response=await fetch(company.logo,{cache:'force-cache'});
    if(!response.ok)throw new Error('Logo niet beschikbaar');
    const bytes=await response.blob();
    const image = await createImageBitmap(bytes);
    const canvas=document.createElement('canvas');
    canvas.width=image.width;canvas.height=image.height;
    canvas.getContext('2d').drawImage(image,0,0);
    image.close?.();
    const jpegBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.86));
    return jpegBlob?await pdf.embedJpg(await jpegBlob.arrayBuffer()):null;
  } catch(_) { return null; }
}
export async function invoicePdfBlob(invoice, opts={}) {
  if(!invoice?.number)throw new Error('Factuurnummer ontbreekt');
  const pdf=await PDFDocument.create();
  pdf.setTitle('Factuur '+invoice.number+' - '+company.name);
  pdf.setAuthor(company.name);
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo=await fetchLogo(pdf);
  let page=pdf.addPage([W,H]);
  let y=H-48;
  const txt=(value,x,yy,size=10,color=dark,font=regular)=>page.drawText(safe(value),{x,y:yy,font,size,color});
  const right=(value,x,yy,size=10,color=dark,font=regular)=>{const t=safe(value);txt(t,x-font.widthOfTextAtSize(t,size),yy,size,color,font)};
  const rule=(yy)=>page.drawLine({start:{x:42,y:yy},end:{x:W-42,y:yy},thickness:.8,color:line});
  const footer=()=>{
    rule(64);
    txt(company.name+' - '+company.address+' - '+company.postalCode+' '+company.city,42,48,8,muted);
    txt('T: '+company.phone+' | '+company.email,42,35,8,muted);
    if(company.iban)txt('IBAN '+company.iban,330,48,8,muted);
    if(company.vatNumber)txt('BTW '+company.vatNumber,330,35,8,muted);
    if(company.chamberOfCommerce)txt('KvK '+company.chamberOfCommerce,440,35,8,muted);
  };
  const newSheet=()=>{
    footer();
    page=pdf.addPage([W,H]); y=H-64;
    txt('Factuur '+invoice.number+' - vervolg',42,y,12,dark,bold);y-=34;
    drawColumnHeader();
  };
  const drawColumnHeader=()=>{
    page.drawRectangle({x:42,y:y-12,width:W-84,height:26,color:rgb(.92,.96,.91)});
    txt('Omschrijving',50,y-4,9,dark,bold);
    right('Aantal',385,y-4,9,dark,bold);
    right('Prijs',465,y-4,9,dark,bold);
    right('Totaal',W-50,y-4,9,dark,bold);
    y-=32;
  };
  if(logo){const ww=268,hh=ww*logo.height/logo.width; page.drawImage(logo,{x:40,y:H-40-hh,width:ww,height:hh});}
  else {txt(company.name,42,H-67,21,dark,bold);txt('Tuin- & parkmachines',42,H-86,9,green);}
  txt(company.address,360,H-55,9,muted);
  txt(company.postalCode+' '+company.city,360,H-69,9,muted);
  txt('T: '+company.phone,360,H-83,9,muted);
  txt(company.email,360,H-97,9,muted);
  rule(H-120);
  txt('FACTUUR',42,H-159,24,dark,bold);
  txt('Factuurnummer',360,H-147,9,muted);
  right(invoice.number,W-42,H-147,10,dark,bold);
  txt('Factuurdatum',360,H-165,9,muted);
  right(dateNL(invoice.date),W-42,H-165,9,dark);
  txt('Vervaldatum',360,H-183,9,muted);
  right(dateNL(invoice.dueDate),W-42,H-183,9,dark);
  if(invoice.status==='Concept' && !opts.asFinal){
    txt('CONCEPT - NIET VERZENDEN',42,H-182,11,green,bold);
  }
  txt('FACTUUR AAN',42,H-223,8,green,bold);
  let cy=H-241;
  const customerFields=[invoice.customerCompanyName,invoice.customer, [invoice.customerStreet,invoice.customerHouseNumber].filter(Boolean).join(' '),[invoice.customerPostalCode,invoice.customerCity].filter(Boolean).join(' '),invoice.customerEmail].filter(Boolean);
  for(const v of customerFields){txt(v,42,cy,10,cy===H-241?dark:muted,cy===H-241?bold:regular);cy-=16;}
  y=H-335;
  drawColumnHeader();
  const rows=invoice.lines||[];
  for(const row of rows){
    const descLines=wrap(row.description,regular,9,242);
    const h=Math.max(25,13*descLines.length+9);
    if(y-h<165)newSheet();
    descLines.forEach((t,i)=>txt(t,50,y-2-13*i,9,dark));
    right(String(row.quantity).replace('.',','),385,y-2,9);
    right(money(row.unitPrice),465,y-2,9);
    right(money(row.lineTotal),W-50,y-2,9,dark,bold);
    y-=h;
    rule(y+5);
  }
  if(y-105<154)newSheet();
  y-=25;
  txt('Subtotaal',365,y,10,muted);
  right(money(invoice.subtotal),W-50,y,10);
  y-=23;
  txt('Btw',365,y,10,muted);
  right(money(invoice.vatTotal),W-50,y,10);
  y-=30;
  page.drawRectangle({x:355,y:y-9,width:W-397,height:30,color:rgb(.91,.96,.87)});
  txt('TOTAAL',365,y+1,11,dark,bold);
  right(money(invoice.amount),W-50,y+1,12,dark,bold);
  y-=38;
  txt('Betaling binnen '+company.paymentDays+' dagen onder vermelding van '+invoice.number+'.',42,y,9,muted);
  if(company.iban)txt('Rekeningnummer: '+company.iban,42,y-16,9,dark);
  if(invoice.jobNumber)txt('Werkopdracht: '+invoice.jobNumber,42,y-32,9,muted);
  footer();
  const count=pdf.getPageCount();
  pdf.getPages().forEach((p,i)=>{
    p.drawText('Pagina '+(i+1)+' / '+count,{x:W-94,y:48,size:8,font:regular,color:muted});
  });
  const bytes=await pdf.save();
  return new Blob([bytes],{type:'application/pdf'});
}
