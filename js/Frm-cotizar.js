// js/Frm-cotizar.js - OPTIMIZADO
import { insertTicket } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cotizacion');
    const mensajeExito = document.getElementById('mensaje-exito');
    const ticketNumeroSpan = document.getElementById('ticketNumero');
    const btnCerrar = document.getElementById('btnCerrarMensaje');
    const btnNueva = document.getElementById('btnNuevaCotizacion');

    if (!form) return;

    function generarCodigoTicket() {
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TK-${año}${mes}${dia}-${aleatorio}`;
    }

    function cerrarMensaje() {
        if (mensajeExito) mensajeExito.style.display = 'none';
        if (form) {
            form.style.display = 'block';
            form.reset();
        }
    }

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarMensaje);
    if (btnNueva) btnNueva.addEventListener('click', cerrarMensaje);

    // Debounce para evitar doble envío
    let enviando = false;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (enviando) return;
        enviando = true;

        const codigoTicket = generarCodigoTicket();
        
        const ticketData = {
            codigo_ticket: codigoTicket,
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            tipo_proyecto: document.getElementById('tipo-proyecto').value,
            presupuesto: document.getElementById('presupuesto').value,
            plazo: document.getElementById('plazo').value,
            descripcion: document.getElementById('descripcion').value.trim(),
            estado: 'recibido'
        };

        if (!ticketData.nombre || !ticketData.email || !ticketData.tipo_proyecto || !ticketData.descripcion) {
            alert('Por favor, completa todos los campos obligatorios (*)');
            enviando = false;
            return;
        }

        const btn = form.querySelector('.btn-enviar');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
        btn.disabled = true;

        try {
            await insertTicket(ticketData);
            
            ticketNumeroSpan.textContent = codigoTicket;
            form.style.display = 'none';
            mensajeExito.style.display = 'block';
        } catch (error) {
            console.error('Error al insertar ticket:', error);
            alert('Hubo un inconveniente al procesar tu solicitud: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            enviando = false;
        }
    });
});