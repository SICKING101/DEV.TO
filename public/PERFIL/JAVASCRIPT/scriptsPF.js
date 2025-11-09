 // =====================================================================
        // MINIBAR FUNCTIONALITY SECTION - MEJORADA
        // =====================================================================
        document.addEventListener('DOMContentLoaded', function() {
            const minibarItems = document.querySelectorAll('.minibar__item');
            let activePreview = null;
            
            function calculatePreviewPosition(link, preview) {
                const linkRect = link.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                let topPosition = linkRect.top;
                const previewHeight = 320; // Altura estimada del preview
                
                // Ajustar si el preview se sale por abajo
                if (topPosition + previewHeight > viewportHeight - 20) {
                    topPosition = viewportHeight - previewHeight - 20;
                }
                
                // Ajustar si el preview se sale por arriba
                if (topPosition < 20) {
                    topPosition = 20;
                }
                
                return topPosition;
            }
            
            function showPreview(item) {
                const preview = item.querySelector('.minibar__preview');
                const link = item.querySelector('.minibar__link');
                
                if (preview && link) {
                    // Ocultar preview anterior
                    if (activePreview && activePreview !== preview) {
                        activePreview.style.display = 'none';
                    }
                    
                    // Calcular y establecer posición
                    const topPosition = calculatePreviewPosition(link, preview);
                    preview.style.top = topPosition + 'px';
                    preview.style.display = 'block';
                    
                    activePreview = preview;
                }
            }
            
            function hidePreview(preview) {
                if (preview) {
                    preview.style.display = 'none';
                }
            }
            
            // Event listeners para cada item
            minibarItems.forEach(item => {
                const link = item.querySelector('.minibar__link');
                const preview = item.querySelector('.minibar__preview');
                
                if (link && preview) {
                    // Mostrar preview al entrar al item
                    item.addEventListener('mouseenter', function() {
                        showPreview(item);
                    });
                    
                    // Ocultar preview al salir del item (con delay)
                    item.addEventListener('mouseleave', function(e) {
                        setTimeout(() => {
                            if (!item.matches(':hover') && !preview.matches(':hover')) {
                                hidePreview(preview);
                            }
                        }, 100);
                    });
                    
                    // Mantener preview visible si el mouse está sobre él
                    preview.addEventListener('mouseenter', function() {
                        preview.style.display = 'block';
                    });
                    
                    preview.addEventListener('mouseleave', function() {
                        hidePreview(preview);
                    });
                }
            });
            
            // Ocultar todos los previews al hacer scroll
            window.addEventListener('scroll', function() {
                if (activePreview) {
                    hidePreview(activePreview);
                }
            });
        });

        // =====================================================================
        // CHARACTER COUNT FUNCTIONALITY SECTION
        // =====================================================================
        document.querySelectorAll('textarea, input[type="text"]').forEach(element => {
            element.addEventListener('input', function () {
                const maxLength = this.getAttribute('maxlength') || 200;
                const currentLength = this.value.length;
                const charCount = this.parentElement.querySelector('.char-count');

                if (charCount) {
                    charCount.textContent = `${currentLength}/${maxLength}`;

                    if (currentLength > maxLength * 0.8) {
                        charCount.style.color = '#ff6b6b';
                    } else {
                        charCount.style.color = '#717171';
                    }
                }
            });

            // Inicializar contadores
            if (element.value) {
                element.dispatchEvent(new Event('input'));
            }
        });

        // =====================================================================
        // BRAND COLOR FUNCTIONALITY SECTION
        // =====================================================================
        const colorInput = document.querySelector('.brand-color-input input');
        const colorPreview = document.querySelector('.color-preview');

        if (colorInput && colorPreview) {
            colorInput.addEventListener('input', function () {
                const colorValue = this.value.startsWith('#') ? this.value : '#' + this.value;
                colorPreview.style.backgroundColor = colorValue;
            });

            // Inicializar color
            colorInput.dispatchEvent(new Event('input'));
        }