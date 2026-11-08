// app.js - VERSIÓN OPTIMIZADA CON CACHÉ
import { obtenerConfigPagina } from './js/supabase-client.js';

const archivos = {
    'home': 'home.html', 'sobre-mi': 'sobre-mi.html', 'sistemas': 'sistemas.html',
    'desarrollo': 'desarrollo.html', 'bases-datos': 'bases-datos.html', 'proyecto': 'proyecto.html',
    'contacto': 'contacto.html', 'cotizar': 'Frm-cotizar.html'
};

const cssEspecificos = {
    'home': 'home.css', 'sobre-mi': 'sobre-mi.css', 'sistemas': 'sistemas.css',
    'desarrollo': 'desarrollo.css', 'bases-datos': 'bases-datos.css', 'proyecto': 'proyecto.css',
    'contacto': 'contacto.css', 'cotizar': 'Frm-cotizar.css'
};

const jsFiles = {
    'home': 'js/home.js', 'sobre-mi': 'js/sobre-mi.js', 'sistemas': 'js/sistemas.js',
    'desarrollo': 'js/desarrollo.js', 'bases-datos': 'js/bases-datos.js', 'proyecto': 'js/proyecto.js',
    'contacto': 'js/contacto.js', 'cotizar': 'js/Frm-cotizar.js'
};

const titulos = {
    'home': 'Inicio | ing.Jfrias', 'sobre-mi': 'Sobre Mí | ing.Jfrias', 'sistemas': 'Sistemas | ing.Jfrias',
    'desarrollo': 'Desarrollo | ing.Jfrias', 'bases-datos': 'Bases de Datos | ing.Jfrias', 'proyecto': 'Proyecto | ing.Jfrias',
    'contacto': 'Contacto | ing.Jfrias', 'cotizar': 'Cotizar | ing.Jfrias'
};

// ===== CACHÉ EN MEMORIA =====
const cache = {
    html: {},      // HTML de páginas
    css: {},       // CSS cargados
    config: {},    // Config de Supabase
    scripts: {}    // Scripts ejecutados
};

// Precarga de recursos en background
const precargar = {
    css: new Set(),
    js: new Set()
};

function cargarCSS(pagina) {
    // 1. CSS Global (solo una vez)
    if (!document.querySelector('link[href="estilos.css"]')) {
        const linkGlobal = document.createElement('link');
        linkGlobal.rel = 'stylesheet';
        linkGlobal.href = 'estilos.css';
        document.head.appendChild(linkGlobal);
    }

    // 2. CSS Específico (evitar duplicados)
    const cssFile = cssEspecificos[pagina];
    if (!cssFile || cache.css[pagina]) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${cssFile}`;
    link.setAttribute('data-page', pagina);
    
    // Precargar para evitar flash de contenido sin estilo
    link.onload = () => { cache.css[pagina] = true; };
    document.head.appendChild(link);
}

async function cargarPagina(nombrePagina) {
    // Guardar en URL
    window.history.pushState({ page: nombrePagina }, '', `?page=${nombrePagina}`);

    const main = document.getElementById('contenido');
    const archivo = archivos[nombrePagina];
    
    if (!archivo) {
        main.innerHTML = '<div class="error" style="text-align:center;padding:3rem;">Página no encontrada</div>';
        return;
    }

    // Mostrar loader solo si no hay caché (evita parpadeo)
    if (!cache.html[nombrePagina]) {
        main.innerHTML = '<div class="loader" style="text-align:center;padding:3rem;color:var(--text-muted);">Cargando...</div>';
    }

    // Cargar CSS en paralelo (no bloquea)
    cargarCSS(nombrePagina);

    try {
        let html;

        // ===== USAR CACHÉ DE HTML =====
        if (cache.html[nombrePagina]) {
            html = cache.html[nombrePagina];
        } else {
            // Descargar HTML
            const response = await fetch(`page/${archivo}`);
            if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
            html = await response.text();

            // Obtener config de Supabase (con caché)
            let config;
            if (cache.config[nombrePagina] !== undefined) {
                config = cache.config[nombrePagina];
            } else {
                config = await obtenerConfigPagina(nombrePagina);
                cache.config[nombrePagina] = config;
            }

            // Aplicar config CMS
            if (config && config.secciones && config.secciones.length > 0) {
                config.secciones.forEach(sec => {
                    if (sec.tipo === 'texto' || sec.tipo === 'html') {
                        const regex = new RegExp(`(<[^>]+data-cms="${sec.clave}"[^>]*>)(.*?)(</[^>]+>)`, 'gs');
                        html = html.replace(regex, `$1${sec.valor}$3`);
                    } else if (sec.tipo === 'imagen') {
                        const imgRegex = new RegExp(`<img([^>]+)data-cms="${sec.clave}"([^>]*)>`, 'g');
                        html = html.replace(imgRegex, `<img$1 src="${sec.valor}"$2>`);
                    }
                });
            }

            // Guardar en caché
            cache.html[nombrePagina] = html;
        }

        // Insertar HTML de una sola vez (más rápido que innerHTML = string)
        main.innerHTML = html;
        document.title = titulos[nombrePagina] || 'ing.Jfrias';
        
        // Marcar activo
        document.querySelectorAll('[data-s]').forEach(link => {
            link.classList.toggle('activo', link.getAttribute('data-s') === nombrePagina);
        });
        
        conectarEventosInternos();
        ejecutarScriptEspecifico(nombrePagina);
        setTimeout(conectarBotonesCTA, 100);

        // Precargar páginas relacionadas en background
        precargarPaginasRelacionadas(nombrePagina);

    } catch (error) {
        console.error('Error:', error);
        main.innerHTML = '<div class="error" style="text-align:center;padding:3rem;">Error al cargar la página.</div>';
    }
}

// Precargar páginas que probablemente el usuario visite
function precargarPaginasRelacionadas(paginaActual) {
    const relaciones = {
        'home': ['sobre-mi', 'proyecto', 'contacto'],
        'sobre-mi': ['proyecto', 'contacto', 'sistemas'],
        'sistemas': ['desarrollo', 'bases-datos', 'contacto'],
        'desarrollo': ['bases-datos', 'proyecto', 'contacto'],
        'bases-datos': ['desarrollo', 'proyecto', 'contacto'],
        'proyecto': ['contacto', 'sobre-mi'],
        'contacto': ['cotizar', 'home'],
        'cotizar': ['contacto', 'home']
    };

    const paginas = relaciones[paginaActual] || [];
    
    // Usar requestIdleCallback para no bloquear
    const precargar = () => {
        paginas.forEach(pagina => {
            if (!cache.html[pagina] && archivos[pagina]) {
                fetch(`page/${archivos[pagina]}`)
                    .then(r => r.text())
                    .then(html => {
                        cache.html[pagina] = html;
                    })
                    .catch(() => {});
            }
            
            // Precargar CSS
            if (!cache.css[pagina] && cssEspecificos[pagina]) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'style';
                link.href = `css/${cssEspecificos[pagina]}`;
                document.head.appendChild(link);
            }
        });
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(precargar);
    } else {
        setTimeout(precargar, 2000);
    }
}

function conectarBotonesCTA() {
    document.querySelectorAll('.btn-cta-premium').forEach(btn => {
        btn.removeEventListener('click', manejadorClickCta);
        btn.addEventListener('click', manejadorClickCta);
    });
}

function manejadorClickCta(e) {
    e.preventDefault(); 
    e.stopPropagation(); 
    cargarPagina('cotizar');
}

function ejecutarScriptEspecifico(pagina) {
    const jsFile = jsFiles[pagina];
    if (!jsFile) return;
    
    // Evitar re-ejecutar scripts
    if (cache.scripts[pagina]) return;
    
    const scriptExistente = document.querySelector(`script[data-page="${pagina}"]`);
    if (scriptExistente) scriptExistente.remove();
    
    const script = document.createElement('script');
    script.src = jsFile;
    script.type = 'module';
    script.setAttribute('data-page', pagina);
    script.onload = () => { cache.scripts[pagina] = true; };
    document.body.appendChild(script);
}

function manejarCV(e) { window.open('docs/cv-julio-frias.pdf', '_blank'); }

function manejadorClick(e) {
    const link = e.target.closest('[data-s]');
    if (!link || (link.href && link.href.startsWith('mailto:'))) return;
    e.preventDefault();
    const pagina = link.getAttribute('data-s');
    if (pagina) cargarPagina(pagina);
}

function manejadorClickMovil(e) {
    e.preventDefault();
    const link = e.target.closest('a');
    if (!link) return;
    const pagina = link.getAttribute('data-s');
    if (pagina) {
        cargarPagina(pagina);
        document.querySelectorAll('.group a, .fixed').forEach(el => el.classList.remove('activo'));
        link.classList.add('activo');
    }
}

function conectarBotonesMoviles() {
    document.querySelectorAll('.group a, .fixed').forEach(btn => {
        btn.removeEventListener('click', manejadorClickMovil);
        btn.addEventListener('click', manejadorClickMovil);
    });
}

function conectarEventosInternos() {
    document.querySelectorAll('[data-s]').forEach(btn => {
        if (!btn.closest('.sidebar-nav') && !btn.closest('.group') && !btn.closest('.fixed')) {
            btn.removeEventListener('click', manejadorClick);
            btn.addEventListener('click', manejadorClick);
        }
    });
    document.querySelectorAll('.sidebar-nav [data-s]').forEach(btn => {
        btn.removeEventListener('click', manejadorClick);
        btn.addEventListener('click', manejadorClick);
    });
    
    const btnCtaSidebar = document.querySelector('.main-sidebar .btn-cta-premium');
    if (btnCtaSidebar) {
        btnCtaSidebar.removeEventListener('click', manejadorClickCta);
        btnCtaSidebar.addEventListener('click', manejadorClickCta);
    }
    
    conectarBotonesCTA();
    conectarBotonesMoviles();
    
    const btnCV = document.querySelector('.btn-cv');
    if (btnCV) {
        btnCV.removeEventListener('click', manejarCV);
        btnCV.addEventListener('click', manejarCV);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paginaInicial = urlParams.get('page') || 'home';
    cargarPagina(paginaInicial);
});

// Manejar navegación con botón atrás/adelante
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
        cargarPagina(e.state.page);
    }
});