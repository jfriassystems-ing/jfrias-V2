// desarrollo.js - Funcionalidades de la página Desarrollo

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de Desarrollo cargada');
    
    // Mostrar tecnologías que dominas
    const tecnologias = [
        { nombre: 'HTML/CSS', nivel: 90 },
        { nombre: 'JavaScript', nivel: 85 },
        { nombre: 'React', nivel: 80 },
        { nombre: 'Node.js', nivel: 75 }
    ];
    
    // Si tienes un contenedor para mostrar habilidades técnicas
    const skillsContainer = document.querySelector('.skills-container');
    if (skillsContainer) {
        skillsContainer.innerHTML = tecnologias.map(tech => `
            <div class="skill-item">
                <span class="skill-nombre">${tech.nombre}</span>
                <div class="skill-bar">
                    <div class="skill-progreso" style="width: ${tech.nivel}%"></div>
                </div>
                <span class="skill-porcentaje">${tech.nivel}%</span>
            </div>
        `).join('');
    }
});