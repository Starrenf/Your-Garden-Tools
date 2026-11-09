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

const mapInvoice = (r) => ({
  id: r.id,
  number: r.invoice_number,
  customer: r.customer_name,
  amount: Number(r.total || 0),
  status: r.status,
  date: r.invoice_date,
  accountingStatus: r.accounting_status,
  pdfPath: r.pdf_path,
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
    const invoices = await supabase.from('invoices').select('*').order('invoice_date', { ascending: false });
    throwIfError(invoices);
    return { ...emptyData(), invoices: (invoices.data || []).map(mapInvoice) };
  }

  const [customers, machines, jobs, workEntries, parts, invoices] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('machines').select('*').order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('work_entries').select('*').order('created_at'),
    supabase.from('parts').select('*').order('created_at'),
    supabase.from('invoices').select('*').order('invoice_date', { ascending: false }),
  ]);

  [customers, machines, jobs, workEntries, parts, invoices].forEach(throwIfError);

  return {
    customers: (customers.data || []).map(mapCustomer),
    machines: (machines.data || []).map(mapMachine),
    jobs: (jobs.data || []).map((job) => mapJob(job, workEntries.data || [], parts.data || [])),
    invoices: (invoices.data || []).map(mapInvoice),
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

export async function createInvoice(form){
 if(!supabase)throw new Error('Supabase is niet beschikbaar.');
 if(!Array.isArray(form.lines)||!form.lines.length)throw new Error('Voeg minstens één factuurregel toe.');
 if(!form.number?.trim()||!form.customer?.trim())throw new Error('Klant en factuurnummer zijn verplicht.');
 if(form.lines.some(x=>!x.description?.trim()||!Number.isFinite(Number(x.quantity))||Number(x.quantity)<=0||Number(x.unit_price)<0))throw new Error('Controleer de factuurregels.');
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw new Error('Log opnieuw in om de conceptfactuur op te slaan.');
 const {data,error}=await supabase.from('invoices').insert({
  invoice_number:form.number.trim(),customer_id:form.customerId||null,customer_name:form.customer.trim(),
  invoice_date:form.date,due_date:form.due,status:'Concept',
  subtotal:form.subtotal,vat_total:form.vatTotal,total:form.total,
  accounting_status:'Nog niet verwerkt',created_by:user.id
 }).select('id').single();
 if(error)throw error;
 const lines=form.lines.map((x,i)=>({invoice_id:data.id,line_type:'other',description:x.description.trim(),quantity:Number(x.quantity),unit_price:Number(x.unit_price),vat_rate:Number(x.vat_rate),line_total:Math.round((Number(x.quantity)*Number(x.unit_price)+Number.EPSILON)*100)/100,sort_order:i}));
 const result=await supabase.from('invoice_lines').insert(lines);
 if(result.error){
  const rollback=await supabase.from('invoices').delete().eq('id',data.id);
  if(rollback.error)throw new Error('Factuurregels konden niet worden opgeslagen. Het factuurconcept is wel aangemaakt. Meld dit bij de beheerder.');
  throw new Error('Factuurregels konden niet worden opgeslagen: '+result.error.message);
 }
 return data;
}
