// contacto.js - Funcionalidades de la página Contacto

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de Contacto cargada');
    
    // Validación de formulario (si agregas uno más completo)
    const formContacto = document.querySelector('#form-contacto');
    if (formContacto) {
        formContacto.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validar campos
            const nombre = document.querySelector('#nombre')?.value;
            const email = document.querySelector('#email')?.value;
            const mensaje = document.querySelector('#mensaje')?.value;
            
            if (!nombre || !email || !mensaje) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            // Enviar datos (ejemplo)
            console.log('Formulario enviado:', { nombre, email, mensaje });
            alert('Mensaje enviado con éxito');
            formContacto.reset();
        });
    }
    
    // Botón de WhatsApp ya está en el HTML con href
    // Puedes agregar tracking
    const btnWhatsapp = document.querySelector('.btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            console.log('Click en WhatsApp - Contacto');
            // Podrías enviar un evento a Google Analytics
        });
    }
    
    // Botón de correo
    const btnEmail = document.querySelector('.btn-primario');
    if (btnEmail && btnEmail.href.includes('mailto:')) {
        btnEmail.addEventListener('click', () => {
            console.log('Click en Email - Contacto');
        });
    }
});