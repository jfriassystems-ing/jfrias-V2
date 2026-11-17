// supabase-client.js - CENTRALIZADO
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ojczmkjhrxigpxcxladg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MraYD-I1K8zhgXOcDP_HrQ_SYbcTXUE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== CACHÉ DE CONFIG =====
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// ===== WEB PÚBLICA =====
export async function insertTicket(ticket) {
    const { data, error } = await supabase.from('tickets').insert([ticket]).select();
    if (error) throw error;
    return data;
}

export async function obtenerConfigPagina(slug) {
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

    configCache.set(slug, { data, timestamp: Date.now() });
    return data;
}

export function limpiarCacheConfig() {
    configCache.clear();
}

// ===== ADMIN: TICKETS =====
export async function getTickets() {
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function updateTicketStatus(id, estado) {
    const { error } = await supabase.from('tickets').update({ estado }).eq('id', id);
    if (error) throw error;
}

export async function deleteTicket(id) {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
}

// ===== ADMIN: CLIENTES =====
export async function getClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function createCliente(cliente) {
    const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
    if (error) throw error;
    return data;
}

export async function deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
}

// ===== ADMIN: SERVICIOS =====
export async function getServicios() {
    const { data, error } = await supabase.from('servicios').select('*').eq('activo', true).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function createServicio(servicio) {
    const { data, error } = await supabase.from('servicios').insert([servicio]).select().single();
    if (error) throw error;
    return data;
}

export async function deleteServicio(id) {
    const { error } = await supabase.from('servicios').update({ activo: false }).eq('id', id);
    if (error) throw error;
}

// ===== ADMIN: FACTURAS =====
export async function getFacturas() {
    const { data, error } = await supabase
        .from('facturas')
        .select(`*, clientes (nombre, telefono, direccion, rnc_cedula)`)
        .order('id', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function getFacturaById(id) {
    const { data: factura, error } = await supabase
        .from('facturas')
        .select(`*, clientes (*)`)
        .eq('id', id)
        .single();
    if (error) throw error;

    const { data: items, error: errItems } = await supabase
        .from('factura_detalle')
        .select('*')
        .eq('factura_id', id);
    if (errItems) throw errItems;

    return {
        ...factura,
        nombre_cliente: factura.clientes?.nombre || null,
        rnc_cliente: factura.clientes?.rnc_cedula || null,
        telefono_cliente: factura.clientes?.telefono || null,
        items: items || []
    };
}

export async function createFactura({ cliente_id, tipo_ncf, items, metodo_pago = null, notas = null }) {
    let totalSub = 0, totalItb = 0;
    items.forEach(i => { totalSub += i.subtotal; totalItb += i.itbis; });
    const totalGen = totalSub + totalItb;

    const ncf = `${tipo_ncf}${Date.now().toString().slice(-8)}`;

    const { data: factura, error } = await supabase
        .from('facturas')
        .insert([{
            ncf,
            tipo_ncf,
            cliente_id,
            subtotal: totalSub,
            itbis: totalItb,
            total: totalGen,
            estatus: 'PENDIENTE',
            metodo_pago,
            notas
        }])
        .select()
        .single();

    if (error) throw error;

    const { error: errDetalle } = await supabase
        .from('factura_detalle')
        .insert(items.map(i => ({ ...i, factura_id: factura.id })));

    if (errDetalle) throw errDetalle;

    return factura;
}

export async function updateFacturaEstado(id, estatus) {
    const { error } = await supabase.from('facturas').update({ estatus }).eq('id', id);
    if (error) throw error;
}

export async function deleteFactura(id) {
    await supabase.from('factura_detalle').delete().eq('factura_id', id);
    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (error) throw error;
}

export async function generarNCF(tipo = 'B01') {
    return `${tipo}${Date.now().toString().slice(-8)}`;
}