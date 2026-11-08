// proyecto.js - OPTIMIZADO
import { supabase } from './supabase-client.js';

let proyectosCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function cargarProyectos() {
    const grid = document.getElementById('grid-proyectos');
    if (!grid) return;

    // Usar caché si está disponible
    if (proyectosCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
        renderizarProyectos(proyectosCache, grid);
        return;
    }

    // Mostrar loader
    grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">Cargando proyectos...</p>';

    try {
        const { data, error } = await supabase
            .from('proyectos')
            .select('*')
            .eq('activo', true)
            .order('id', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error de Supabase:", error.message);
            grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">Error al cargar proyectos.</p>';
            return;
        }

        proyectosCache = data;
        cacheTimestamp = Date.now();
        renderizarProyectos(data, grid);

    } catch (err) {
        console.error('Error:', err);
        grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">Error al cargar proyectos.</p>';
    }
}

function renderizarProyectos(data, grid) {
    if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">No hay proyectos guardados aún.</p>';
        return;
    }

    // Usar DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    data.forEach(p => {
        const card = document.createElement('div');
        card.className = 'proyecto-card';

        let mediaHTML = '';
        if (p.youtube_id) {
            mediaHTML = `<div style="width: 100%; aspect-ratio: 16/9; background: #000;">
                <iframe src="https://www.youtube.com/embed/${p.youtube_id}" 
                        style="width:100%; height:100%; border:none;" 
                        loading="lazy"
                        allowfullscreen>
                </iframe>
            </div>`;
        } else if (p.imagen_portada) {
            mediaHTML = `<img src="${p.imagen_portada}" alt="${p.titulo}" class="proyecto-img" loading="lazy">`;
        } else {
            mediaHTML = '<div class="proyecto-img-placeholder"><i class="fa-solid fa-code"></i></div>';
        }

        card.innerHTML = `
            ${mediaHTML}
            <div class="proyecto-info">
                <h3>${escapeHtml(p.titulo)}</h3>
                <p>${escapeHtml(p.descripcion || '')}</p>
            </div>
        `;

        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

cargarProyectos();