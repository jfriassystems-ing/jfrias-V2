import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ojczmkjhrxigpxcxladg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_MraYD-I1K8zhgXOcDP_HrQ_SYbcTXUE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Web Pública ---
export async function insertTicket(ticket) {
    const { data, error } = await supabase.from('tickets').insert([ticket]).select();
    if (error) throw error;
    return data;
}

export async function obtenerConfigPagina(slug) {
    const { data, error } = await supabase
        .from('paginas')
        .select(`id, titulo, activa, secciones (clave, tipo, valor)`)
        .eq('slug', slug)
        .eq('activa', true)
        .maybeSingle(); // 👈 Usamos maybeSingle para evitar el error 406
    
    if (error) {
        console.warn(`No se encontró config para la página: ${slug}`);
        return null;
    }
    return data;
}