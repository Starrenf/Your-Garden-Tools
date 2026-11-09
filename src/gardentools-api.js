import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);
export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const emptyData = () => ({ customers: [], machines: [], jobs: [], invoices: [] });
const throwIfError = ({ error }) => { if (error) throw error; };

export const getDisplayName = (session, profile) =>
  profile?.display_name ||
  session?.user?.user_metadata?.display_name ||
  session?.user?.user_metadata?.full_name ||
  session?.user?.email ||
  'Gebruiker';

export async function getProfile() {
  if (!supabase) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,email,display_name,role,must_change_password,password_changed_at,is_active')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

const mapCustomer = (r) => ({
  id: r.id,
  name: r.name,
  phone: r.phone || '',
  email: r.email || '',
  address: [r.street, r.house_number].filter(Boolean).join(' '),
  city: r.city || '',
});

const mapMachine = (r) => ({
  id: r.id,
  customerId: r.customer_id,
  type: r.machine_type,
  brand: r.brand || '',
  model: r.model || '',
  serial: r.serial_number || '',
  engine: r.engine || '',
});

const mapJob = (r, labor = [], parts = []) => ({
  id: r.id,
  number: r.job_number,
  customerId: r.customer_id,
  machineId: r.machine_id,
  title: r.title,
  complaint: r.complaint || '',
  diagnosis: r.diagnosis || '',
  status: r.status,
  created: r.created_date,
  due: r.due_date,
  labor: labor.filter((x) => x.job_id === r.id).map((x) => ({
    id: x.id,
    description: x.description,
    qty: Number(x.quantity),
    price: Number(x.unit_price),
  })),
  parts: parts.filter((x) => x.job_id === r.id).map((x) => ({
    id: x.id,
    description: x.description,
    qty: Number(x.quantity),
    price: Number(x.unit_price),
  })),
});

const mapInvoice = (r, allLines = []) => ({
  id: r.id,
  number: r.invoice_number,
  customer: r.customer_name,
  customerCompanyName: r.customer_company_name || '',
  customerStreet: r.customer_street || '',
  customerHouseNumber: r.customer_house_number || '',
  customerPostalCode: r.customer_postal_code || '',
  customerCity: r.customer_city || '',
  customerEmail: r.customer_email || '',
  customerId: r.customer_id,
  jobId: r.job_id,
  amount: Number(r.total || 0),
  subtotal: Number(r.subtotal || 0),
  vatTotal: Number(r.vat_total || 0),
  status: r.status,
  date: r.invoice_date,
  dueDate: r.due_date,
  finalizedAt: r.finalized_at,
  sentAt: r.sent_at,
  accountingStatus: r.accounting_status,
  pdfPath: r.pdf_path,
  lines: allLines.filter(x=>x.invoice_id===r.id).sort((a,b)=>a.sort_order-b.sort_order).map(x=>({
    id:x.id,description:x.description,quantity:Number(x.quantity),unitPrice:Number(x.unit_price),
    vatRate:Number(x.vat_rate),lineTotal:Number(x.line_total),type:x.line_type
  })),
});

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthSession(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase is nog niet geconfigureerd.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function changeInitialPassword(currentPassword, newPassword) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const { data, error } = await supabase.functions.invoke('change-initial-password', {
    body: { currentPassword, newPassword },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return true;
}

export async function loadAppData(role) {
  if (!supabase) return emptyData();

  if (role === 'accountant') {
    const [invoices, invoiceLines] = await Promise.all([
      supabase.from('invoices').select('*').order('invoice_date', { ascending: false }),
      supabase.from('invoice_lines').select('*').order('sort_order'),
    ]);
    [invoices,invoiceLines].forEach(throwIfError);
    return { ...emptyData(), invoices: (invoices.data || []).map(r=>mapInvoice(r,invoiceLines.data||[])) };
  }

  const [customers, machines, jobs, workEntries, parts, invoices, invoiceLines] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('machines').select('*').order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('work_entries').select('*').order('created_at'),
    supabase.from('parts').select('*').order('created_at'),
    supabase.from('invoices').select('*').order('invoice_date', { ascending: false }),
    supabase.from('invoice_lines').select('*').order('sort_order'),
  ]);

  [customers, machines, jobs, workEntries, parts, invoices, invoiceLines].forEach(throwIfError);

  return {
    customers: (customers.data || []).map(mapCustomer),
    machines: (machines.data || []).map(mapMachine),
    jobs: (jobs.data || []).map((job) => mapJob(job, workEntries.data || [], parts.data || [])),
    invoices: (invoices.data || []).map(r=>mapInvoice(r,invoiceLines.data||[])),
  };
}

export async function createCustomer(form) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const { data, error } = await supabase.from('customers').insert({
    name: form.name,
    phone: form.phone || null,
    email: form.email || null,
    street: form.address || null,
    city: form.city || null,
  }).select().single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function createJob(form) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const { data, error } = await supabase.from('jobs').insert({
    job_number: null,
    customer_id: form.customerId,
    machine_id: form.machineId || null,
    title: form.title,
    complaint: form.complaint || null,
    due_date: form.due || null,
    status: 'Nieuw',
  }).select().single();
  if (error) throw error;
  return mapJob(data);
}

export async function updateJobStatus(jobId, status) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const { data, error } = await supabase.from('jobs').update({ status }).eq('id', jobId).select().single();
  if (error) throw error;
  return data;
}


export async function getInvoiceById(id) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const [invoice, lines] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', id).single(),
    supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order'),
  ]);
  [invoice,lines].forEach(throwIfError);
  return mapInvoice(invoice.data,lines.data||[]);
}

export async function createInvoiceDraft(form) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const lines = (form.lines || []).filter(x=>String(x.description||'').trim()).map(x=>({
    description:String(x.description).trim(),
    quantity:Number(x.quantity),
    unit_price:Number(x.unitPrice),
    vat_rate:Number(x.vatRate),
    line_type:x.type||'other'
  }));
  const {data,error}=await supabase.rpc('create_invoice_draft',{
    p_customer_id:form.customerId,p_job_id:form.jobId||null,p_due_date:form.dueDate||null,p_lines:lines
  });
  if(error) throw error;
  return getInvoiceById(data);
}

export async function saveFinalInvoicePdf(invoice, blob) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  if (invoice.status !== 'Concept') throw new Error('Alleen een conceptfactuur kan definitief worden gemaakt.');
  const year=String(invoice.date||new Date().toISOString()).slice(0,4);
  const path=year+'/'+invoice.number+'-'+invoice.id+'.pdf';
  const uploaded=await supabase.storage.from('invoice-pdfs').upload(path,blob,{
    contentType:'application/pdf',upsert:false,cacheControl:'3600'
  });
  if(uploaded.error){
    if(!/already exists|duplicate/i.test(uploaded.error.message||''))throw uploaded.error;
    throw new Error('Er bestaat al een PDF voor deze factuur. Neem contact op voordat je opnieuw definitief maakt.');
  }
  const saved=await supabase.from('invoices')
    .update({status:'Definitief',pdf_path:path,finalized_at:new Date().toISOString()})
    .eq('id',invoice.id).eq('status','Concept').select('id').single();
  if(saved.error)throw saved.error;
  await supabase.from('invoice_events').insert({
    invoice_id:invoice.id,action:'finalized',note:'Definitieve PDF opgeslagen'
  });
  return getInvoiceById(invoice.id);
}

export async function invoicePdfFromStorage(path) {
  if (!supabase) throw new Error('Supabase is niet beschikbaar.');
  const {data,error}=await supabase.storage.from('invoice-pdfs').download(path);
  if(error)throw error;
  return data;
}

export async function sendFinalInvoice(invoiceId) {
  if (!supabase)throw new Error('Supabase is niet beschikbaar.');
  const {data,error}=await supabase.functions.invoke('send-invoice',{body:{invoiceId}});
  if(error){
    const context=error.context;
    let detail='';
    if(context && typeof context.json==='function'){
      try {const body=await context.json();detail=body.error||'';}catch(_){}
    }
    throw new Error(detail||error.message||'Factuur kon niet worden verzonden.');
  }
  if(data?.error)throw new Error(data.error);
  return data;
}
