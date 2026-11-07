// sistemas.js - Funcionalidades de la página Sistemas

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de Sistemas cargada');
    
    // Puedes agregar animaciones específicas
    // O cargar proyectos destacados desde una API
    // O mostrar un catálogo de sistemas desarrollados
    
    // Ejemplo: Mostrar proyectos de sistemas
    const proyectos = [
        { nombre: 'ERP Empresarial', estado: 'Activo' },
        { nombre: 'CRM Personalizado', estado: 'En desarrollo' }
    ];
    
    // Si agregas un contenedor de proyectos en el HTML
    const contenedor = document.querySelector('.proyectos-container');
    if (contenedor) {
        contenedor.innerHTML = proyectos.map(p => 
            `<div class="proyecto-card">
                <h3>${p.nombre}</h3>
                <span class="estado">${p.estado}</span>
            </div>`
        ).join('');
    }
});