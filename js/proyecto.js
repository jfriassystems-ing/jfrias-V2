import { supabase } from './supabase-client.js';

setTimeout(async () => {
    const grid = document.getElementById('grid-proyectos');
    if (!grid) return;

    try {
        const { data, error } = await supabase.from('proyectos').select('*');

        if (error) {
            console.error("Error de Supabase:", error.message);
            return;
        }

        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; width: 100%;">No hay proyectos guardados aún.</p>';
            return;
        }

        // Generamos las tarjetas con el video incrustado directamente
        grid.innerHTML = data.map(p => `
            <div class="proyecto-card">
                ${p.youtube_id 
                    ? `<div style="width: 100%; aspect-ratio: 16/9; background: #000;">
                         <iframe src="https://www.youtube.com/embed/${p.youtube_id}" 
                                 style="width:100%; height:100%; border:none;" 
                                 allowfullscreen>
                         </iframe>
                       </div>`
                    : (p.imagen_portada 
                        ? `<img src="${p.imagen_portada}" alt="${p.titulo}" class="proyecto-img">` 
                        : '<div class="proyecto-img-placeholder"><i class="fa-solid fa-code"></i></div>')
                }
                <div class="proyecto-info">
                    <h3>${p.titulo}</h3>
                    <p>${p.descripcion || ''}</p>
                </div>
            </div>
        `).join('');

        console.log(`✅ Se mostraron ${data.length} proyectos con videos incrustados.`);

    } catch (err) {
        console.error("Error inesperado:", err);
    }
}, 500);