// home.js - Funcionalidades específicas de la página de inicio

document.addEventListener('DOMContentLoaded', () => {
    // Animación de entrada para las tarjetas tech
    const techCards = document.querySelectorAll('.tech-card');
    techCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Efecto de escritura en el título (opcional)
    const titulo = document.querySelector('.titulo-hero');
    if (titulo && titulo.innerText === 'Jfriassystems.do') {
        // Puedes agregar un efecto de máquina de escribir si quieres
    }
    
    // Contador de visitas o cualquier otra métrica
    console.log('Home page loaded');
});

// home.js
document.addEventListener('DOMContentLoaded', () => {
    // Detectar Brave
    const isBrave = navigator.brave ? true : false;
    
    const btnCorreo = document.querySelector('.btn-outline[href*="mailto"]');
    if (btnCorreo && isBrave) {
        btnCorreo.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirigir a la página de contacto en Brave
            if (typeof cargarPagina === 'function') {
                cargarPagina('contacto');
            }
        });
    }
});