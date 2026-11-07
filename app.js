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

function cargarCSS(pagina) {
    // 1. CSS Global
    if (!document.querySelector('link[href="estilos.css"]')) {
        const linkGlobal = document.createElement('link');
        linkGlobal.rel = 'stylesheet';
        linkGlobal.href = 'estilos.css';
        document.head.appendChild(linkGlobal);
    }

    // 2. CSS Específico
    const cssFile = cssEspecificos[pagina];
    if (!cssFile) return;
    
    const linkExistente = document.querySelector(`link[data-page="${pagina}"]`);
    if (linkExistente) linkExistente.remove();
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${cssFile}`; 
    link.setAttribute('data-page', pagina);
    document.head.appendChild(link);
}

async function cargarPagina(nombrePagina) {
    // 👇 GUARDAR EN LA URL
    window.history.pushState({ page: nombrePagina }, '', `?page=${nombrePagina}`);

    const main = document.getElementById('contenido');
    main.innerHTML = '<div class="loader" style="text-align: center; padding: 3rem; color: var(--text-muted);">Cargando...</div>';
    
    const archivo = archivos[nombrePagina];
    if (!archivo) return main.innerHTML = '<div class="error">Página no encontrada</div>';
    
    cargarCSS(nombrePagina);
    
    try {
        const response = await fetch(`page/${archivo}`);
        if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
        let html = await response.text();

        const config = await obtenerConfigPagina(nombrePagina);

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

        main.innerHTML = html;
        document.title = titulos[nombrePagina] || 'ing.Jfrias';
        
        document.querySelectorAll('[data-s]').forEach(link => {
            link.classList.toggle('activo', link.getAttribute('data-s') === nombrePagina);
        });
        
        conectarEventosInternos();
        ejecutarScriptEspecifico(nombrePagina);
        setTimeout(conectarBotonesCTA, 100);

    } catch (error) {
        console.error('Error:', error);
        main.innerHTML = '<div class="error" style="text-align: center; padding: 3rem;">Error al cargar la página.</div>';
    }
}

function conectarBotonesCTA() {
    document.querySelectorAll('.btn-cta-premium').forEach(btn => {
        btn.removeEventListener('click', manejadorClickCta);
        btn.addEventListener('click', manejadorClickCta);
    });
}

function manejadorClickCta(e) {
    e.preventDefault(); e.stopPropagation(); cargarPagina('cotizar');
}

function ejecutarScriptEspecifico(pagina) {
    const jsFile = jsFiles[pagina];
    if (!jsFile) return;
    const scriptExistente = document.querySelector(`script[data-page="${pagina}"]`);
    if (scriptExistente) scriptExistente.remove();
    const script = document.createElement('script');
    script.src = jsFile;
    script.type = 'module'; 
    script.setAttribute('data-page', pagina);
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

// 👇 LEER LA URL AL INICIAR
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paginaInicial = urlParams.get('page') || 'home';
    cargarPagina(paginaInicial);
});