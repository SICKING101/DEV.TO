// =====================================================================
// SECCION 1: MINIBAR FUNCTIONALITY - Funcionalidad de la barra lateral mini
// =====================================================================

// Esta sección maneja los previews interactivos que aparecen al pasar el mouse sobre los íconos de la barra lateral
document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los elementos de la minibar (íconos como inicio, trending, etc.)
    const minibarItems = document.querySelectorAll('.minibar__item');
    // Variable para trackear el preview actualmente activo
    let activePreview = null;
    
    // Función para calcular la posición óptima del preview evitando que se salga de la pantalla
    function calculatePreviewPosition(link, preview) {
        // Obtener posición y dimensiones del enlace sobre el que se hace hover
        const linkRect = link.getBoundingClientRect();
        // Obtener altura de la ventana del navegador
        const viewportHeight = window.innerHeight;
        
        // Posición inicial: misma posición vertical que el enlace
        let topPosition = linkRect.top;
        // Altura estimada del preview (podría calcularse dinámicamente)
        const previewHeight = 320;
        
        // Ajustar si el preview se sale por la parte inferior de la pantalla
        // Se deja 20px de margen con el borde inferior
        if (topPosition + previewHeight > viewportHeight - 20) {
            topPosition = viewportHeight - previewHeight - 20;
        }
        
        // Ajustar si el preview se sale por la parte superior de la pantalla
        // Se deja 20px de margen con el borde superior
        if (topPosition < 20) {
            topPosition = 20;
        }
        
        return topPosition;
    }
    
    // Función para mostrar el preview de un ítem específico
    function showPreview(item) {
        // Buscar elementos del preview y el enlace dentro del ítem
        const preview = item.querySelector('.minibar__preview');
        const link = item.querySelector('.minibar__link');
        
        // Verificar que ambos elementos existan
        if (preview && link) {
            // Ocultar preview anterior si existe y es diferente al actual
            // Esto evita tener múltiples previews visibles simultáneamente
            if (activePreview && activePreview !== preview) {
                activePreview.style.display = 'none';
            }
            
            // Calcular posición óptima y aplicarla al preview
            const topPosition = calculatePreviewPosition(link, preview);
            preview.style.top = topPosition + 'px';
            // Hacer visible el preview
            preview.style.display = 'block';
            
            // Actualizar referencia al preview activo
            activePreview = preview;
        }
    }
    
    // Función para ocultar un preview específico
    function hidePreview(preview) {
        if (preview) {
            preview.style.display = 'none';
        }
    }
    
    // Configurar event listeners para cada ítem de la minibar
    minibarItems.forEach(item => {
        // Buscar elementos dentro de cada ítem
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');
        
        // Solo configurar eventos si el ítem tiene ambos elementos
        if (link && preview) {
            // Mostrar preview cuando el mouse entra en el ítem
            item.addEventListener('mouseenter', function() {
                showPreview(item);
            });
            
            // Ocultar preview cuando el mouse sale del ítem
            // Se usa setTimeout para dar tiempo al usuario para mover el mouse al preview
            item.addEventListener('mouseleave', function(e) {
                setTimeout(() => {
                    // Verificar que el mouse no esté sobre el ítem o el preview
                    // Esto evita que el preview se oculte prematuramente
                    if (!item.matches(':hover') && !preview.matches(':hover')) {
                        hidePreview(preview);
                    }
                }, 100); // Delay de 100ms para mejor experiencia de usuario
            });
            
            // Mantener el preview visible cuando el mouse está sobre él
            preview.addEventListener('mouseenter', function() {
                preview.style.display = 'block';
            });
            
            // Ocultar preview cuando el mouse sale del preview
            preview.addEventListener('mouseleave', function() {
                hidePreview(preview);
            });
        }
    });
    
    // Ocultar todos los previews cuando el usuario hace scroll
    // Esto mejora la experiencia evitando previews en posiciones incorrectas
    window.addEventListener('scroll', function() {
        if (activePreview) {
            hidePreview(activePreview);
        }
    });
});

// =====================================================================
// SECCION 2: CHARACTER COUNT FUNCTIONALITY - Contador de caracteres en campos de texto
// =====================================================================

// Aplica contadores de caracteres a todos los textareas e inputs de texto en la página
document.querySelectorAll('textarea, input[type="text"]').forEach(element => {
    // Evento que se dispara cada vez que el usuario escribe en el campo
    element.addEventListener('input', function () {
        // Obtener el límite máximo de caracteres del atributo HTML o usar 200 por defecto
        const maxLength = this.getAttribute('maxlength') || 200;
        // Contar caracteres actuales en el campo
        const currentLength = this.value.length;
        // Buscar el elemento que muestra el contador (debe estar en el mismo contenedor padre)
        const charCount = this.parentElement.querySelector('.char-count');

        // Si existe el elemento contador, actualizarlo
        if (charCount) {
            // Actualizar texto mostrando progreso (ej: "45/200")
            charCount.textContent = `${currentLength}/${maxLength}`;

            // Cambiar color del texto según el porcentaje de uso
            // Rojo cuando se supera el 80% del límite (advertencia visual)
            if (currentLength > maxLength * 0.8) {
                charCount.style.color = '#ff6b6b'; // Color rojo de advertencia
            } else {
                charCount.style.color = '#717171'; // Color gris normal
            }
        }
    });

    // Inicializar contadores si el campo ya tiene valor al cargar la página
    // Esto asegura que el contador muestre el valor correcto desde el inicio
    if (element.value) {
        // Disparar el evento input manualmente para calcular el contador inicial
        element.dispatchEvent(new Event('input'));
    }
});

// =====================================================================
// SECCION 3: BRAND COLOR FUNCTIONALITY - Selector de color de marca personalizable
// =====================================================================

// Maneja la funcionalidad del selector de color para personalización de marca/theme
// Buscar el input de color y el elemento preview donde se muestra el color seleccionado
const colorInput = document.querySelector('.brand-color-input input');
const colorPreview = document.querySelector('.color-preview');

// Verificar que ambos elementos existan en la página antes de agregar funcionalidad
if (colorInput && colorPreview) {
    // Evento que se dispara cada vez que el valor del input cambia (usuario selecciona/escribe color)
    colorInput.addEventListener('input', function () {
        // Asegurar que el valor del color siempre empiece con '#'
        // Algunos navegadores pueden devolver el valor sin el # o el usuario puede escribirlo sin él
        const colorValue = this.value.startsWith('#') ? this.value : '#' + this.value;
        
        // Aplicar el color seleccionado como fondo del elemento preview
        // Esto da retroalimentación visual inmediata al usuario
        colorPreview.style.backgroundColor = colorValue;
    });

    // Inicializar el color al cargar la página
    // Esto asegura que el preview muestre el color actual desde el inicio
    colorInput.dispatchEvent(new Event('input'));
}