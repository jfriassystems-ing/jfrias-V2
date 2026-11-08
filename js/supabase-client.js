// supabase-client.js - OPTIMIZADO
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ojczmkjhrxigpxcxladg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MraYD-I1K8zhgXOcDP_HrQ_SYbcTXUE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== CACHÉ DE CONFIG =====
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// --- Web Pública ---
export async function insertTicket(ticket) {
    const { data, error } = await supabase.from('tickets').insert([ticket]).select();
    if (error) throw error;
    return data;
}

export async function obtenerConfigPagina(slug) {
    // Verificar caché
    const cached = configCache.get(slug);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    const { data, error } = await supabase
        .from('paginas')
        .select(`id, titulo, activa, secciones (clave, tipo, valor)`)
        .eq('slug', slug)
        .eq('activa', true)
        .maybeSingle();

    if (error) {
        console.warn(`No se encontró config para la página: ${slug}`);
        return null;
    }

    // Guardar en caché
    configCache.set(slug, { data, timestamp: Date.now() });
    return data;
}

// Función para limpiar caché manualmente
export function limpiarCacheConfig() {
    configCache.clear();
}