// panel-admin.js - VERSIÓN FINAL COMPLETA
import { supabase } from '../js/supabase-client.js';

// ========== VARIABLES GLOBALES ==========
let ticketsData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentChart = null;
let itemsFactura = [];
let paginaActualCMS = 'home';

// ========== UTILIDADES ==========
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.style.backgroundColor = tipo === 'success' ? '#10b981' : '#ef4444';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

function sanitize(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== AUTENTICACIÓN ==========
async function verificarAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    document.getElementById('user-name').textContent = session.user.email;
    return true;
}

async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// ========== MÓDULO: TICKETS ==========
async function cargarTickets() {
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) {
        mostrarToast('Error al cargar tickets', 'error');
        return [];
    }
    ticketsData = data || [];
    return data;
}

function actualizarEstadisticas() {
    document.getElementById('total-tickets').textContent = ticketsData.length;
    document.getElementById('recibidos').textContent = ticketsData.filter(t => t.estado === 'recibido').length;
    document.getElementById('leidos').textContent = ticketsData.filter(t => t.estado === 'leido').length;
    document.getElementById('respondidos').textContent = ticketsData.filter(t => t.estado === 'respondido').length;
    document.getElementById('badge-pendientes').textContent = ticketsData.filter(t => t.estado === 'recibido').length;
}

function renderizarGrafico() {
    const ctx = document.getElementById('stats-chart')?.getContext('2d');
    if (!ctx) return;
    const ticketsPorMes = {};
    ticketsData.forEach(t => {
        const f = new Date(t.created_at);
        const key = `${f.getFullYear()}-${f.getMonth() + 1}`;
        ticketsPorMes[key] = (ticketsPorMes[key] || 0) + 1;
    });
    const meses = Object.keys(ticketsPorMes).sort();
    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{ label: 'Tickets', data: meses.map(m => ticketsPorMes[m]), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

function renderizarTabla() {
    const tbody = document.getElementById('tabla-tickets');
    if (!tbody) return;
    const filtro = document.getElementById('filtro-estado').value;
    const busqueda = document.getElementById('buscar-ticket').value.toLowerCase();

    let filtrados = [...ticketsData];
    if (filtro !== 'todos') filtrados = filtrados.filter(t => t.estado === filtro);
    if (busqueda) filtrados = filtrados.filter(t => 
        (t.nombre?.toLowerCase().includes(busqueda)) ||
        (t.email?.toLowerCase().includes(busqueda)) ||
        (t.codigo_ticket?.toLowerCase().includes(busqueda))
    );

    const totalPages = Math.ceil(filtrados.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginados = filtrados.slice(start, start + itemsPerPage);

    if (paginados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loader">No hay tickets</td></tr>';
    } else {
        tbody.innerHTML = paginados.map(t => `
            <tr class="ticket-row" data-id="${t.id}">
                <td><strong>${sanitize(t.codigo_ticket)}</strong></td>
                <td>${formatearFecha(t.created_at)}</td>
                <td><span class="status-badge status-${t.estado}">${t.estado}</span></td>
                <td>${sanitize(t.nombre)}</td>
                <td>${sanitize(t.email)}</td>
                <td>${sanitize(t.tipo_proyecto)}</td>
                <td>${sanitize(t.presupuesto || 'N/A')}</td>
            </tr>
        `).join('');
    }

    const paginacionDiv = document.getElementById('paginacion');
    if (paginacionDiv) {
        paginacionDiv.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => 
            `<button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`
        ).join('') : '';
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.onclick = () => { currentPage = parseInt(btn.dataset.page); renderizarTabla(); };
        });
    }

    document.querySelectorAll('.ticket-row').forEach(row => {
        row.onclick = () => {
            const ticket = ticketsData.find(t => t.id === parseInt(row.dataset.id));
            if (ticket) abrirModalTicket(ticket);
        };
    });
}

function abrirModalTicket(ticket) {
    const modal = document.getElementById('modal-detalle');
    document.getElementById('modal-body').innerHTML = `
        <div class="detail-field"><label>Código:</label><p><strong>${sanitize(ticket.codigo_ticket)}</strong></p></div>
        <div class="detail-field"><label>Estado:</label><p><span class="status-badge status-${ticket.estado}">${ticket.estado}</span></p></div>
        <div class="detail-field"><label>Cliente:</label><p>${sanitize(ticket.nombre)}</p></div>
        <div class="detail-field"><label>Email:</label><p>${sanitize(ticket.email)}</p></div>
        <div class="detail-field"><label>Teléfono:</label><p>${sanitize(ticket.telefono || 'N/A')}</p></div>
        <div class="detail-field"><label>Tipo:</label><p>${sanitize(ticket.tipo_proyecto)}</p></div>
        <div class="detail-field"><label>Descripción:</label><p>${sanitize(ticket.descripcion)}</p></div>
    `;
    modal.style.display = 'flex';

    document.getElementById('modal-wa').onclick = () => {
        const phone = ticket.telefono?.replace(/\D/g, '');
        if (phone) window.open(`https://wa.me/${phone}?text=Hola ${ticket.nombre}`, '_blank');
        else alert('Sin teléfono');
    };
    document.getElementById('modal-leer').onclick = async () => {
        await supabase.from('tickets').update({ estado: 'leido' }).eq('id', ticket.id);
        cerrarModal(); await refreshData();
        mostrarToast('Marcado como leído');
    };
    document.getElementById('modal-eliminar').onclick = async () => {
        if (!confirm('¿Eliminar ticket?')) return;
        await supabase.from('tickets').delete().eq('id', ticket.id);
        cerrarModal(); await refreshData();
        mostrarToast('Ticket eliminado');
    };
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

async function refreshData() {
    await cargarTickets();
    actualizarEstadisticas();
    renderizarGrafico();
    renderizarTabla();
}

// ========== MÓDULO: FACTURACIÓN ==========
async function loadClientesFact() {
    const { data } = await supabase.from('clientes').select('*').order('id', { ascending: false });
    if (!data) return;
    document.getElementById('fact-total-clientes').innerText = data.length;
    const tbody = document.getElementById('tabla-clientes-fact');
    if (tbody) {
        tbody.innerHTML = data.map(c => `
            <tr>
                <td>${c.id}</td><td>${sanitize(c.nombre)}</td><td>${sanitize(c.email)}</td>
                <td>${sanitize(c.telefono || '-')}</td><td>${sanitize(c.rnc_cedula || '-')}</td>
                <td>${sanitize(c.tipo_contribuyente)}</td>
                <td><button onclick="deleteClienteFact(${c.id})" style="background:#e74c3c; padding:4px 8px; border:none; border-radius:4px; color:white;">🗑️</button></td>
            </tr>
        `).join('');
    }
    const select = document.getElementById('fact-cliente');
    if (select) {
        select.innerHTML = '<option value="">Seleccione cliente...</option>' + data.map(c => 
            `<option value="${c.id}" data-rnc="${c.rnc_cedula}">${c.nombre} - ${c.rnc_cedula}</option>`
        ).join('');
    }
}

async function loadServiciosFact() {
    const { data } = await supabase.from('servicios').select('*').eq('activo', true).order('id', { ascending: false });
    if (!data) return;
    document.getElementById('fact-total-servicios').innerText = data.length;
    const tbody = document.getElementById('tabla-servicios-fact');
    if (tbody) {
        tbody.innerHTML = data.map(s => `
            <tr>
                <td>${s.id}</td><td>${s.tipo}</td><td>${s.codigo || '-'}</td>
                <td>${sanitize(s.nombre)}</td><td>${sanitize(s.descripcion || '-')}</td>
                <td>$${parseFloat(s.precio).toFixed(2)}</td><td>${s.itbis_tasa}%</td>
                <td><button onclick="deleteServicioFact(${s.id})" style="background:#e74c3c; padding:4px 8px; border:none; border-radius:4px; color:white;">🗑️</button></td>
            </tr>
        `).join('');
    }
}

async function loadFacturasFact() {
    const { data } = await supabase.from('facturas').select(`*, clientes (nombre, telefono, direccion, rnc_cedula)`).order('id', { ascending: false });
    if (!data) return;
    document.getElementById('fact-total-facturas').innerText = data.length;
    let totalFacturado = 0;
    const tbody = document.getElementById('tabla-facturas-fact');
    if (tbody) {
        tbody.innerHTML = data.map(f => {
            totalFacturado += parseFloat(f.total || 0);
            const nombre = f.clientes?.nombre || f.nombre_cliente || '-';
            return `
                <tr>
                    <td>${f.ncf || '-'}</td><td>${sanitize(nombre)}</td>
                    <td>${formatearFecha(f.created_at)}</td>
                    <td>$${parseFloat(f.subtotal || 0).toFixed(2)}</td>
                    <td>$${parseFloat(f.itbis || 0).toFixed(2)}</td>
                    <td><strong>$${parseFloat(f.total || 0).toFixed(2)}</strong></td>
                    <td>
                        <select class="estado-factura" data-id="${f.id}" style="background:var(--bg-dark); border:1px solid var(--border); color:white; padding:4px 8px; border-radius:4px;">
                            <option value="PENDIENTE" ${f.estatus === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                            <option value="PAGADA" ${f.estatus === 'PAGADA' ? 'selected' : ''}>PAGADA</option>
                            <option value="ANULADA" ${f.estatus === 'ANULADA' ? 'selected' : ''}>ANULADA</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="eliminarFactura(${f.id})" style="background:#e74c3c; padding:4px 8px; border:none; border-radius:4px; color:white;">🗑️</button>
                        <button onclick="abrirPrintFactura(${f.id})" style="background:#3b82f6; padding:4px 8px; border:none; border-radius:4px; color:white;"><i class="fa-solid fa-print"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    document.getElementById('fact-total-facturado').innerText = `$${totalFacturado.toFixed(2)}`;
}

// ========== MÓDULO: CMS ==========
async function cargarEditorPagina(slug) {
    paginaActualCMS = slug;
    const editorDiv = document.getElementById('cms-editor');
    editorDiv.innerHTML = '<div class="loader">Cargando editor...</div>';

    let { data: pagina, error } = await supabase.from('paginas').select('*').eq('slug', slug).maybeSingle();

    if (!pagina) {
        const { data: nuevaPagina } = await supabase.from('paginas').insert([{ slug: slug, titulo: slug.toUpperCase() }]).select().single();
        pagina = nuevaPagina;
    }

    const { data: secciones } = await supabase.from('secciones').select('*').eq('pagina_id', pagina.id);

    let html = `
        <div class="form-group" style="margin-bottom:20px;">
            <label style="display:flex; align-items:center; gap:10px; color:var(--text-main); font-weight:bold;">
                <input type="checkbox" id="cms-pagina-activa" ${pagina.activa ? 'checked' : ''}> Página activa en el menú
            </label>
        </div>
    `;

    if (secciones && secciones.length > 0) {
        secciones.forEach(sec => {
            html += `
                <div class="form-group" style="margin-bottom:15px; padding:15px; background:var(--bg-dark); border-radius:8px;">
                    <label style="color:var(--primary); font-weight:600;">${sec.clave} (${sec.tipo})</label>
                    <div style="display:flex; gap:10px; margin-top:8px;">
                        ${sec.tipo === 'html' 
                            ? `<textarea id="cms-input-${sec.id}" style="flex:1; min-height:80px; padding:8px; background:var(--bg-card); border:1px solid var(--border); color:white; border-radius:8px;">${sec.valor || ''}</textarea>`
                            : `<input type="text" id="cms-input-${sec.id}" value="${sec.valor || ''}" style="flex:1; padding:8px; background:var(--bg-card); border:1px solid var(--border); color:white; border-radius:8px;">`
                        }
                        <button onclick="guardarSeccionCMS(${sec.id})" style="background:#3b82f6; border:none; padding:8px 16px; border-radius:8px; color:white; cursor:pointer;">💾</button>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p style="color:var(--text-muted);">No hay secciones configuradas para esta página.</p>';
    }

    html += `
        <div style="margin-top:30px; padding:20px; border:1px dashed var(--primary); border-radius:8px;">
            <h4 style="color:var(--primary); margin-bottom:15px;">➕ Agregar nueva sección</h4>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <input type="text" id="new-clave" placeholder="Ej: hero_titulo" style="flex:1; min-width:150px; padding:8px; background:var(--bg-dark); border:1px solid var(--border); color:white; border-radius:8px;">
                <select id="new-tipo" style="padding:8px; background:var(--bg-dark); border:1px solid var(--border); color:white; border-radius:8px;">
                    <option value="texto">Texto</option>
                    <option value="html">HTML</option>
                    <option value="imagen">URL Imagen</option>
                </select>
                <button onclick="crearSeccionCMS()" style="background:#10b981; border:none; padding:8px 16px; border-radius:8px; color:white; cursor:pointer;">Crear</button>
            </div>
        </div>
    `;

    editorDiv.innerHTML = html;

    document.getElementById('cms-pagina-activa')?.addEventListener('change', async (e) => {
        await supabase.from('paginas').update({ activa: e.target.checked }).eq('id', pagina.id);
        mostrarToast(e.target.checked ? 'Página activada' : 'Página desactivada');
    });
}

window.guardarSeccionCMS = async (seccionId) => {
    const input = document.getElementById(`cms-input-${seccionId}`);
    if (!input) return;
    await supabase.from('secciones').update({ valor: input.value }).eq('id', seccionId);
    mostrarToast('✅ Sección actualizada');
};

window.crearSeccionCMS = async () => {
    const clave = document.getElementById('new-clave').value.trim();
    const tipo = document.getElementById('new-tipo').value;
    if (!clave) return mostrarToast('Escribe una clave', 'error');

    const { data: pagina } = await supabase.from('paginas').select('id').eq('slug', paginaActualCMS).single();
    if (!pagina) return;

    await supabase.from('secciones').insert([{ pagina_id: pagina.id, clave, tipo, valor: '' }]);
    mostrarToast('✅ Sección creada');
    cargarEditorPagina(paginaActualCMS);
};

async function cargarProyectosCMS() {
    const { data } = await supabase.from('proyectos').select('*').order('id', { ascending: false });
    const tbody = document.getElementById('tabla-proyectos-cms');
    if (!tbody) return;
    
    tbody.innerHTML = (data || []).map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.imagen_portada ? `<img src="${p.imagen_portada}" style="width: 50px; border-radius: 4px;">` : '-'}</td>
            <td>${sanitize(p.titulo)}</td>
            <td><code>${p.youtube_id || '-'}</code></td>
            <td><input type="checkbox" ${p.activo ? 'checked' : ''} onchange="toggleProyecto(${p.id}, this.checked)"></td>
            <td><button onclick="eliminarProyecto(${p.id})" style="background:#e74c3c; padding:4px 8px; border:none; border-radius:4px; color:white;">🗑️</button></td>
        </tr>
    `).join('');
}

async function subirImagen(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `portadas/${fileName}`;
    
    const { error } = await supabase.storage.from('imagenes-proyectos').upload(filePath, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from('imagenes-proyectos').getPublicUrl(filePath);
    return data.publicUrl;
}

document.getElementById('btn-save-proyecto')?.addEventListener('click', async () => {
    const titulo = document.getElementById('proy-titulo').value.trim();
    const youtube = document.getElementById('proy-youtube').value.trim();
    const descripcion = document.getElementById('proy-descripcion').value.trim();
    const file = document.getElementById('proy-imagen').files[0];

    if (!titulo) return mostrarToast('El título es obligatorio', 'error');

    try {
        let imagenUrl = null;
        if (file) imagenUrl = await subirImagen(file);

        await supabase.from('proyectos').insert([{ titulo, youtube_id: youtube, descripcion, imagen_portada: imagenUrl }]);

        mostrarToast('✅ Proyecto creado');
        document.getElementById('proy-titulo').value = '';
        document.getElementById('proy-youtube').value = '';
        document.getElementById('proy-descripcion').value = '';
        document.getElementById('proy-imagen').value = '';
        cargarProyectosCMS();
    } catch (err) {
        mostrarToast('❌ Error al guardar proyecto', 'error');
    }
});

window.toggleProyecto = async (id, activo) => {
    await supabase.from('proyectos').update({ activo }).eq('id', id);
    mostrarToast(activo ? 'Proyecto activado' : 'Proyecto desactivado');
};

window.eliminarProyecto = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    await supabase.from('proyectos').delete().eq('id', id);
    cargarProyectosCMS();
    mostrarToast('Proyecto eliminado');
};

// ========== LÓGICA DE FACTURAS ==========
function renderItemsFactura() {
    const tbody = document.getElementById('tabla-items-fact');
    if (!tbody) return;
    let subtotal = 0;
    const aplicarItbis = document.getElementById('check-itbis')?.checked !== false;
    
    tbody.innerHTML = itemsFactura.map((item, i) => {
        subtotal += item.subtotal;
        const itbis = aplicarItbis ? item.itbis : 0;
        const total = aplicarItbis ? item.total : item.subtotal;
        return `
            <tr>
                <td>${item.descripcion}</td>
                <td>
                    <input type="number" class="cantidad-item" value="${item.cantidad}" min="1" data-index="${i}" style="width:60px; padding:4px; background:var(--bg-dark); border:1px solid var(--border); color:white; border-radius:4px;">
                </td>
                <td>$${item.precio_unitario.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td>$${itbis.toFixed(2)}</td>
                <td>$${total.toFixed(2)}</td>
                <td>
                    <button onclick="removeItemFact(${i})" style="background:#e74c3c; padding:4px 8px; border:none; border-radius:4px; color:white; cursor:pointer;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.cantidad-item').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const nuevaCantidad = parseInt(this.value) || 1;
            if (nuevaCantidad < 1) {
                this.value = 1;
                return;
            }
            const item = itemsFactura[index];
            if (item) {
                item.cantidad = nuevaCantidad;
                item.subtotal = item.precio_unitario * nuevaCantidad;
                item.itbis = item.subtotal * 0.18;
                item.total = item.subtotal + item.itbis;
                renderItemsFactura();
            }
        });
    });

    const itbisTotal = aplicarItbis ? subtotal * 0.18 : 0;
    const totalGeneral = aplicarItbis ? subtotal + itbisTotal : subtotal;
    document.getElementById('total-sub').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total-itb').textContent = `$${itbisTotal.toFixed(2)}`;
    document.getElementById('total-gen').textContent = `$${totalGeneral.toFixed(2)}`;
}

async function cargarServiciosParaSeleccionar() {
    const { data } = await supabase.from('servicios').select('*').eq('activo', true);
    const tbody = document.getElementById('tabla-items-seleccionar');
    if (!tbody) return;
    tbody.innerHTML = (data || []).map(s => `
        <tr>
            <td>${s.codigo || '-'}</td>
            <td>${sanitize(s.nombre)}</td>
            <td>${sanitize(s.descripcion || '-')}</td>
            <td>$${parseFloat(s.precio).toFixed(2)}</td>
            <td><input type="checkbox" class="checkbox-seleccionar" data-id="${s.id}" data-nombre="${s.nombre}" data-precio="${s.precio}"></td>
        </tr>
    `).join('');
}

document.getElementById('check-itbis')?.addEventListener('change', renderItemsFactura);

document.getElementById('btn-add-item')?.addEventListener('click', function() {
    const seccion = document.getElementById('seccion-agregar-items');
    if (seccion.style.display === 'none' || seccion.style.display === '') {
        seccion.style.display = 'block';
        cargarServiciosParaSeleccionar();
    } else {
        seccion.style.display = 'none';
        document.getElementById('tabla-items-seleccionar').innerHTML = '';
    }
});

document.getElementById('tabla-items-seleccionar')?.addEventListener('change', function(e) {
    if (e.target.classList.contains('checkbox-seleccionar')) {
        const checkbox = e.target;
        const id = parseInt(checkbox.dataset.id);
        const nombre = checkbox.dataset.nombre;
        const precio = parseFloat(checkbox.dataset.precio);
        
        if (checkbox.checked) {
            const existe = itemsFactura.some(item => item.servicio_id === id);
            if (existe) {
                mostrarToast('⚠️ Ya está agregado', 'error');
                checkbox.checked = false;
                return;
            }
            const itbis = precio * 0.18;
            itemsFactura.push({ descripcion: nombre, cantidad: 1, precio_unitario: precio, subtotal: precio, itbis: itbis, total: precio + itbis, servicio_id: id });
            mostrarToast(`✅ ${nombre} agregado`);
            checkbox.checked = false;
        }
        renderItemsFactura();
    }
});

document.getElementById('btn-create-factura')?.addEventListener('click', async () => {
    const clienteId = document.getElementById('fact-cliente')?.value;
    const ncf = document.getElementById('fact-ncf')?.value;
    const tipoNCF = document.getElementById('fact-tipo-ncf')?.value || 'B01';
    const aplicarItbis = document.getElementById('check-itbis')?.checked !== false;
    
    if (!clienteId) return mostrarToast('❌ Seleccione un cliente', 'error');
    if (!ncf) return mostrarToast('❌ Genere un NCF', 'error');
    if (itemsFactura.length === 0) return mostrarToast('❌ Agregue un item', 'error');
    
    try {
        const itemsParaFactura = itemsFactura.map(item => ({
            servicio_id: item.servicio_id || null, descripcion: item.descripcion,
            cantidad: item.cantidad, precio_unitario: item.precio_unitario,
            subtotal: item.subtotal, tasa_itbis: aplicarItbis ? 18 : 0,
            itbis: aplicarItbis ? item.itbis : 0, total: aplicarItbis ? item.total : item.subtotal
        }));
        
        let totalSub = 0, totalItb = 0;
        itemsParaFactura.forEach(i => { totalSub += i.subtotal; totalItb += i.itbis; });
        const totalGen = totalSub + totalItb;

        const { data: factura, error } = await supabase.from('facturas').insert([{
            ncf, tipo_ncf: tipoNCF, cliente_id: parseInt(clienteId),
            subtotal: totalSub, itbis: totalItb, total: totalGen, estatus: 'PENDIENTE'
        }]).select().single();

        if (error) throw error;

        await supabase.from('factura_detalle').insert(itemsParaFactura.map(i => ({ ...i, factura_id: factura.id })));

        mostrarToast(`✅ Factura creada: ${ncf}`);
        itemsFactura = [];
        renderItemsFactura();
        document.getElementById('fact-ncf').value = '';
        document.getElementById('fact-cliente').value = '';
        document.getElementById('seccion-agregar-items').style.display = 'none';
        loadFacturasFact();
        
    } catch (error) {
        mostrarToast('❌ Error al crear factura: ' + error.message, 'error');
    }
});

document.getElementById('tabla-facturas-fact')?.addEventListener('change', async function(e) {
    if (e.target.classList.contains('estado-factura')) {
        const id = parseInt(e.target.dataset.id);
        const estado = e.target.value;
        await supabase.from('facturas').update({ estatus: estado }).eq('id', id);
        mostrarToast(`✅ Estado actualizado`);
        loadFacturasFact();
    }
});

window.abrirPrintFactura = async function(facturaId) {
    try {
        const { data: facturaData } = await supabase.from('facturas').select('*, clientes(*)').eq('id', facturaId).single();
        const { data: items } = await supabase.from('factura_detalle').select('*').eq('factura_id', facturaId);
        if (!facturaData) return mostrarToast('❌ Error al cargar', 'error');
        const modal = document.getElementById('modal-print-factura');
        const body = document.getElementById('print-body');
        
        body.innerHTML = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 100%; padding: 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1a2a3a; padding-bottom:15px; margin-bottom:20px;">
                    <div><h1 style="margin:0; font-size:28px; color:#1a2a3a;">JFriasSystems.do</h1><p style="margin:3px 0; font-size:11px; color:#666;">RNC: 40242884852</p></div>
                    <div style="text-align:right;"><div style="background:#1a2a3a; color:white; padding:8px 20px; border-radius:4px; display:inline-block;"><span style="font-size:12px;">FACTURA</span><span style="font-size:18px; font-weight:700; display:block;">${facturaData.ncf}</span></div></div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <div><p style="margin:0; font-size:10px; color:#999;">Cliente</p><p style="margin:3px 0; font-size:14px; font-weight:600;">${facturaData.clientes?.nombre || '-'}</p></div>
                    <div style="text-align:right;"><p style="margin:0; font-size:10px; color:#999;">Fecha</p><p style="margin:3px 0; font-size:14px; font-weight:600;">${formatearFecha(facturaData.created_at)}</p></div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:20px;">
                    <thead><tr style="background:#1a2a3a; color:white;"><th style="padding:12px; text-align:left;">Descripción</th><th style="padding:12px; text-align:center;">Cant</th><th style="padding:12px; text-align:right;">Precio</th><th style="padding:12px; text-align:right;">Total</th></tr></thead>
                    <tbody>${(items || []).map((item, i) => `<tr style="${i % 2 === 0 ? 'background:#fafafa;' : 'background:white;'}"><td style="padding:10px; border-bottom:1px solid #eee;">${item.descripcion}</td><td style="padding:10px; text-align:center;">${item.cantidad}</td><td style="padding:10px; text-align:right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td><td style="padding:10px; text-align:right; font-weight:600;">$${parseFloat(item.total).toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
                <div style="display:flex; justify-content:flex-end;"><div style="width:280px;">
                    <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:13px;"><span>Subtotal</span><span>$${parseFloat(facturaData.subtotal).toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:13px;"><span>ITBIS (18%)</span><span>$${parseFloat(facturaData.itbis).toFixed(2)}</span></div>
                    <div style="display:flex; justify-content:space-between; padding:12px 0; font-size:18px; font-weight:700; border-top:3px solid #1a2a3a;"><span>TOTAL</span><span>$${parseFloat(facturaData.total).toFixed(2)}</span></div>
                </div></div>
            </div>
        `;
        modal.style.display = 'flex';
    } catch (error) { mostrarToast('❌ Error al cargar factura', 'error'); }
};

window.imprimirFactura = function() {
    const contenido = document.getElementById('print-body').innerHTML;
    const ventana = window.open('', '_blank');
    ventana.document.write(`<html><head><title>Factura</title></head><body style="font-family:Arial; padding:20px;">${contenido}</body></html>`);
    ventana.document.close();
    ventana.print();
};

window.cerrarPrintFactura = function() { document.getElementById('modal-print-factura').style.display = 'none'; };

// ========== EVENTOS GLOBALES ==========
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await verificarAuth();
    if (!isAuth) return;

    await refreshData();
    loadClientesFact(); loadServiciosFact(); loadFacturasFact();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            const section = item.dataset.section;
            document.getElementById(`${section}-section`)?.classList.add('active');

            if (section === 'dashboard') renderizarGrafico();
            if (section === 'cms') { cargarEditorPagina('home'); cargarProyectosCMS(); }
        };
    });

    document.getElementById('select-pagina')?.addEventListener('change', function() { cargarEditorPagina(this.value); });

    const headerUser = document.querySelector('.header-user');
    if (headerUser) {
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i>';
        logoutBtn.title = 'Cerrar Sesión';
        logoutBtn.style.cssText = 'background: none; border: none; color: #ef4444; cursor: pointer; margin-left: 15px; font-size: 18px;';
        logoutBtn.onclick = cerrarSesion;
        headerUser.appendChild(logoutBtn);
    }

    document.getElementById('btn-save-cliente')?.addEventListener('click', async () => {
        await supabase.from('clientes').insert([{ nombre: document.getElementById('cli-nombre').value, email: document.getElementById('cli-email').value, telefono: document.getElementById('cli-telefono').value, rnc_cedula: document.getElementById('cli-rnc').value, tipo_contribuyente: document.getElementById('cli-tipo').value }]);
        loadClientesFact(); mostrarToast('Cliente guardado');
    });

    document.getElementById('btn-save-servicio')?.addEventListener('click', async () => {
        const tipo = document.getElementById('serv-tipo').value;
        await supabase.from('servicios').insert([{ tipo, codigo: `SERV-${Date.now().toString().slice(-4)}`, nombre: document.getElementById('serv-nombre').value, descripcion: document.getElementById('serv-descripcion').value, precio: parseFloat(document.getElementById('serv-precio').value) || 0, itbis_tasa: parseFloat(document.getElementById('serv-itbis').value) || 0 }]);
        loadServiciosFact(); mostrarToast('Servicio guardado');
        document.getElementById('serv-nombre').value = ''; document.getElementById('serv-precio').value = '';
    });

    document.getElementById('btn-gen-ncf')?.addEventListener('click', async () => {
        const tipo = document.getElementById('fact-tipo-ncf').value;
        document.getElementById('fact-ncf').value = `${tipo}${Date.now().toString().slice(-8)}`;
        mostrarToast('NCF generado');
    });

    document.querySelectorAll('.tab-fact').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-fact').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-fact-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
            if (btn.dataset.tab === 'clientes') loadClientesFact();
            if (btn.dataset.tab === 'servicios') loadServiciosFact();
            if (btn.dataset.tab === 'facturas') loadFacturasFact();
        };
    });
});

window.deleteClienteFact = async (id) => { if (confirm('¿Eliminar cliente?')) { await supabase.from('clientes').delete().eq('id', id); loadClientesFact(); mostrarToast('Cliente eliminado'); } };
window.deleteServicioFact = async (id) => { if (confirm('¿Desactivar servicio?')) { await supabase.from('servicios').update({ activo: false }).eq('id', id); loadServiciosFact(); mostrarToast('Servicio desactivado'); } };
window.eliminarFactura = async (id) => { if (confirm('¿Eliminar factura?')) { await supabase.from('factura_detalle').delete().eq('factura_id', id); await supabase.from('facturas').delete().eq('id', id); loadFacturasFact(); mostrarToast('Factura eliminada'); } };
window.removeItemFact = (i) => { itemsFactura.splice(i, 1); renderItemsFactura(); };