import { supabase } from './gardentools-api.js';

const table = () => {
  if (!supabase) throw new Error('De verbinding met Supabase ontbreekt.');
  return supabase.from('site_maintenance');
};

/** Publieke status: alleen de schakelstand en wijzigingsdatum zijn leesbaar. */
export async function readMaintenance() {
  const {data,error} = await table().select('enabled,updated_at').eq('id',1).single();
  if(error) throw error;
  return {enabled:data.enabled===true,updatedAt:data.updated_at};
}

/** De database-RLS staat wijzigen uitsluitend toe aan een actieve owner. */
export async function updateMaintenance(enabled) {
  const {data,error}=await table().update({enabled:enabled===true}).eq('id',1)
    .select('enabled,updated_at').single();
  if(error) throw error;
  return {enabled:data.enabled===true,updatedAt:data.updated_at};
}
