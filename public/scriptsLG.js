// =====================================================================
// SECCION 1: MINIBAR FUNCTIONALITY - Funcionalidad de la Barra Lateral Mini
// =====================================================================

// Se ejecuta cuando el DOM está completamente cargado para asegurar que todos los elementos existan
document.addEventListener('DOMContentLoaded', function() {
    // Obtener TODOS los elementos de la minibar (íconos de navegación lateral)
    const minibarItems = document.querySelectorAll('.minibar__item');
    // Variable para almacenar el preview actualmente activo y controlar que solo uno esté visible
    let activePreview = null;
    
    // FUNCIÓN: Calcular la posición vertical óptima para mostrar el preview
    // Evita que el preview se salga de los límites de la ventana del navegador
    function calculatePreviewPosition(link, preview) {
        // Obtener la posición y dimensiones del enlace sobre el que se hace hover
        const linkRect = link.getBoundingClientRect();
        // Obtener la altura visible de la ventana del navegador
        const viewportHeight = window.innerHeight;
        
        // Posición inicial: alineado verticalmente con el ítem de la minibar
        let topPosition = linkRect.top;
        // Altura fija estimada del preview (podría mejorarse calculándola dinámicamente)
        const previewHeight = 320;
        
        // AJUSTE 1: Si el preview se sale por la parte INFERIOR de la pantalla
        // Calcula: posición actual + altura del preview > altura de ventana - margen
        if (topPosition + previewHeight > viewportHeight - 20) {
            // Reposiciona: altura ventana - altura preview - margen de seguridad
            topPosition = viewportHeight - previewHeight - 20;
        }
        
        // AJUSTE 2: Si el preview se sale por la parte SUPERIOR de la pantalla
        if (topPosition < 20) {
            // Fija la posición al margen superior de seguridad
            topPosition = 20;
        }
        
        // Retorna la posición vertical calculada para el preview
        return topPosition;
    }
    
    // FUNCIÓN: Mostrar el preview de un ítem específico de la minibar
    function showPreview(item) {
        // Buscar el elemento preview dentro del ítem actual
        const preview = item.querySelector('.minibar__preview');
        // Buscar el enlace dentro del ítem actual
        const link = item.querySelector('.minibar__link');
        
        // Verificar que ambos elementos existan antes de proceder
        if (preview && link) {
            // GESTIÓN DE ESTADO: Ocultar el preview anterior si existe y es diferente al actual
            // Esto evita tener múltiples previews visibles simultáneamente
            if (activePreview && activePreview !== preview) {
                activePreview.style.display = 'none';
            }
            
            // CALCULAR POSICIÓN: Obtener la posición optimizada para el preview
            const topPosition = calculatePreviewPosition(link, preview);
            // APLICAR POSICIÓN: Establecer la posición vertical calculada
            preview.style.top = topPosition + 'px';
            // HACER VISIBLE: Mostrar el preview
            preview.style.display = 'block';
            
            // ACTUALIZAR ESTADO: Guardar referencia al preview ahora activo
            activePreview = preview;
        }
    }
    
    // FUNCIÓN: Ocultar un preview específico
    function hidePreview(preview) {
        // Verificar que el preview exista antes de intentar ocultarlo
        if (preview) {
            preview.style.display = 'none';
        }
    }
    
    // CONFIGURACIÓN DE EVENT LISTENERS PARA CADA ÍTEM DE LA MINIBAR
    minibarItems.forEach(item => {
        // Buscar elementos internos necesarios para cada ítem
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');
        
        // Solo configurar eventos si el ítem tiene tanto enlace como preview
        if (link && preview) {
            // EVENTO 1: Mouse ENTER en el ítem - Mostrar preview
            item.addEventListener('mouseenter', function() {
                showPreview(item);
            });
            
            // EVENTO 2: Mouse LEAVE del ítem - Ocultar preview (con delay inteligente)
            item.addEventListener('mouseleave', function(e) {
                // Usar setTimeout para dar tiempo al usuario de mover el mouse al preview
                setTimeout(() => {
                    // Verificar DOBLE condición antes de ocultar:
                    // 1. El mouse NO está sobre el ítem original
                    // 2. El mouse NO está sobre el preview
                    // Esto evita que el preview se oculte cuando el usuario intenta interactuar con él
                    if (!item.matches(':hover') && !preview.matches(':hover')) {
                        hidePreview(preview);
                    }
                }, 100); // Delay de 100ms para transición suave
            });
            
            // EVENTO 3: Mouse ENTER en el preview - Mantenerlo visible
            preview.addEventListener('mouseenter', function() {
                preview.style.display = 'block';
            });
            
            // EVENTO 4: Mouse LEAVE del preview - Ocultarlo inmediatamente
            preview.addEventListener('mouseleave', function() {
                hidePreview(preview);
            });
        }
    });
    
    // EVENTO GLOBAL: Ocultar todos los previews al hacer SCROLL
    // Esto mejora la UX evitando previews en posiciones incorrectas durante el scroll
    window.addEventListener('scroll', function() {
        if (activePreview) {
            hidePreview(activePreview);
        }
    });
});

// =====================================================================
// SECCION 2: CHARACTER COUNT FUNCTIONALITY - Contador de Caracteres
// =====================================================================

// Aplica contadores de caracteres a TODOS los textareas e inputs de texto en la página
document.querySelectorAll('textarea, input[type="text"]').forEach(element => {
    // EVENTO: Se dispara cada vez que el usuario escribe o modifica el contenido
    element.addEventListener('input', function () {
        // Obtener el límite máximo de caracteres:
        // 1. Primero intenta obtener del atributo HTML 'maxlength'
        // 2. Si no existe, usa 200 como valor por defecto
        const maxLength = this.getAttribute('maxlength') || 200;
        // Contar la cantidad actual de caracteres en el campo
        const currentLength = this.value.length;
        // Buscar el elemento que muestra el contador (debe estar en el contenedor padre)
        const charCount = this.parentElement.querySelector('.char-count');

        // Si existe el elemento contador, actualizar su contenido y estilo
        if (charCount) {
            // ACTUALIZAR TEXTO: Mostrar progreso en formato "actual/máximo"
            charCount.textContent = `${currentLength}/${maxLength}`;

            // CAMBIAR COLOR SEGÚN USO:
            // Si se supera el 80% del límite, mostrar en ROJO como advertencia
            if (currentLength > maxLength * 0.8) {
                charCount.style.color = '#ff6b6b'; // Color rojo de advertencia
            } else {
                charCount.style.color = '#717171'; // Color gris normal
            }
        }
    });

    // INICIALIZACIÓN: Si el campo ya tiene valor al cargar la página
    // Disparar el evento 'input' manualmente para calcular el contador inicial
    if (element.value) {
        element.dispatchEvent(new Event('input'));
    }
});

// =====================================================================
// SECCION 3: BRAND COLOR FUNCTIONALITY - Selector de Color de Marca
// =====================================================================

// Obtener referencia al input donde el usuario introduce/selecciona el color
const colorInput = document.querySelector('.brand-color-input input');
// Obtener referencia al elemento que muestra la previsualización del color
const colorPreview = document.querySelector('.color-preview');

// Verificar que AMBOS elementos existan antes de agregar la funcionalidad
if (colorInput && colorPreview) {
    // EVENTO: Se dispara cada vez que el valor del input de color cambia
    colorInput.addEventListener('input', function () {
        // NORMALIZAR FORMATO: Asegurar que el valor del color siempre empiece con '#'
        // Algunos navegadores o usuarios pueden introducir el color sin el símbolo #
        const colorValue = this.value.startsWith('#') ? this.value : '#' + this.value;
        
        // APLICAR COLOR: Establecer el color seleccionado como fondo del elemento preview
        // Esto proporciona retroalimentación visual inmediata al usuario
        colorPreview.style.backgroundColor = colorValue;
    });

    // INICIALIZACIÓN: Disparar el evento 'input' manualmente al cargar la página
    // Esto asegura que el preview muestre el color actual desde el inicio
    colorInput.dispatchEvent(new Event('input'));
}