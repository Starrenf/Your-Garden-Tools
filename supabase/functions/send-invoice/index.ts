import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const respond=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:cors});
const validEmail=(x:unknown)=>typeof x==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const encode=(bytes:Uint8Array)=>{
 let str='';
 for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(str);
};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return respond(405,{error:'Alleen POST is toegestaan.'});
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return respond(401,{error:'Inloggen is vereist.'});
 const supabaseUrl=Deno.env.get('SUPABASE_URL')||'';
 const anonKey=Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||Deno.env.get('SUPABASE_ANON_KEY')||'';
 if(!supabaseUrl||!anonKey)return respond(503,{error:'Supabase-instellingen ontbreken.'});
 const supabase=createClient(supabaseUrl,anonKey,{
   global:{headers:{Authorization:'Bearer '+token}},
   auth:{persistSession:false,autoRefreshToken:false}
 });
 const {data:{user},error:authError}=await supabase.auth.getUser(token);
 if(authError||!user)return respond(401,{error:'Ongeldige of verlopen sessie.'});
 const {data:profile,error:profileError}=await supabase.from('profiles')
   .select('role,is_active,must_change_password').eq('user_id',user.id).single();
 if(profileError||!profile||!profile.is_active||profile.must_change_password||!['owner','workshop'].includes(profile.role)){
   return respond(403,{error:'Geen toestemming om facturen te verzenden.'});
 }
 let body:{invoiceId?:string};
 try{body=await req.json();}catch(_){return respond(400,{error:'Ongeldige aanvraag.'});}
 if(!body.invoiceId||!/^([0-9a-f]{8}-){4}[0-9a-f]{12}$/i.test(body.invoiceId)){
   return respond(400,{error:'Ongeldig factuur-ID.'});
 }
 const {data:invoice,error:invoiceError}=await supabase.from('invoices').select('*')
   .eq('id',body.invoiceId).single();
 if(invoiceError||!invoice)return respond(404,{error:'Factuur niet gevonden.'});
 if(invoice.status!=='Definitief'||!invoice.pdf_path)return respond(409,{error:'Maak de factuur eerst definitief met opgeslagen PDF.'});
 if(!validEmail(invoice.customer_email))return respond(400,{error:'Het e-mailadres op de factuur is ongeldig of ontbreekt.'});
 const resendKey=Deno.env.get('RESEND_API_KEY');
 const sender=Deno.env.get('INVOICE_FROM_EMAIL');
 if(!resendKey||!sender)return respond(503,{error:'Automatisch e-mailen is nog niet ingericht. Configureer Resend en een geverifieerd afzenderadres; gebruik zolang de knop voor het eigen e-mailprogramma.'});
 const {data:blob,error:fileError}=await supabase.storage.from('invoice-pdfs').download(invoice.pdf_path);
 if(fileError||!blob)return respond(409,{error:'De vastgelegde factuur-PDF kon niet worden gelezen.'});
 if(blob.size>8_000_000)return respond(413,{error:'De factuur-PDF is te groot om te mailen.'});
 const b64=encode(new Uint8Array(await blob.arrayBuffer()));
 const subject='Factuur '+invoice.invoice_number+' - Your Garden Tools';
 const customer=String(invoice.customer_name||'klant').slice(0,120);
 const txt='Beste '+customer+',\n\nBijgevoegd ontvangt u factuur '+invoice.invoice_number+' van Your Garden Tools, met een totaalbedrag van EUR '+Number(invoice.total||0).toFixed(2).replace('.',',')+'.\n\nMet vriendelijke groet,\nLudo Neven\nYour Garden Tools\ninfo@yourgardentools.nl\n043-3654183';
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{
    Authorization:'Bearer '+resendKey,
    'Content-Type':'application/json',
    'Idempotency-Key':'ygt-invoice-'+invoice.id
  },
  body:JSON.stringify({
    from:sender,
    to:[invoice.customer_email],
    subject,
    text:txt,
    attachments:[{filename:'Factuur-'+invoice.invoice_number+'.pdf',content:b64}]
  })
 });
 const provider=await response.json().catch(()=>({}));
 if(!response.ok){
   return respond(502,{error:'E-mailprovider heeft verzending niet bevestigd: '+String(provider?.message||response.statusText).slice(0,240)});
 }
 const saved=await supabase.from('invoices')
   .update({status:'Verzonden',sent_at:new Date().toISOString()})
   .eq('id',invoice.id).eq('status','Definitief').select('id').single();
 if(saved.error){
   // Resend confirmed dispatch; do not recommend resending and risk duplicates.
   return respond(207,{error:'E-mailprovider heeft verzending bevestigd, maar de factuurstatus kon niet worden bijgewerkt. Controleer de factuurhistorie vóór opnieuw verzenden.',messageId:provider.id,dispatched:true});
 }
 await supabase.from('invoice_events').insert({
   invoice_id:invoice.id,action:'sent',user_id:user.id,
   note:'Verstuurd naar '+invoice.customer_email+' | Resend '+String(provider.id||'')
 });
 return respond(200,{ok:true,messageId:provider.id});
});
