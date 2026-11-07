// sobre-mi.js - Funcionalidades de la página Sobre Mí

document.addEventListener('DOMContentLoaded', () => {
    // Botón de descargar CV
    const btnCV = document.querySelector('.btn-cv');
    if (btnCV) {
        btnCV.addEventListener('click', () => {
            // Reemplaza con la ruta real de tu CV
            window.open('docs/cv-julio-frias.pdf', '_blank');
        });
    }
    
    // Efecto hover mejorado en la foto de perfil
    const fotoPerfil = document.querySelector('.foto-perfil');
    if (fotoPerfil) {
        fotoPerfil.addEventListener('mouseenter', () => {
            console.log('Foto de perfil en foco');
        });
    }
    
    // Tooltip en las habilidades (opcional)
    const habilidades = document.querySelectorAll('.bio-box ul li');
    habilidades.forEach(habilidad => {
        habilidad.addEventListener('click', () => {
            console.log(`Habilidad seleccionada: ${habilidad.innerText}`);
            // Podrías mostrar más información de cada habilidad
        });
    });
});