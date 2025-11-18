/**
 * CLASE PRINCIPAL PARA LA CREACIÓN DE POSTS
 * Maneja toda la funcionalidad del formulario de creación de posts
 * Incluye validación, manejo de tags, imágenes de portada y envío al servidor
 */
class CreatePost {
    constructor() {
        // Array para almacenar los tags actuales del post
        this.currentTags = [];
        
        // Límite máximo de tags permitidos por post
        this.maxTags = 4;
        
        // Inicializar la clase
        this.init();
    }

    /**
     * INICIALIZACIÓN PRINCIPAL
     * Configura todos los event listeners y verifica autenticación
     */
    init() {
        this.bindEvents();
        this.checkAuthentication();
    }

    /**
     * VERIFICACIÓN DE AUTENTICACIÓN
     * Comprueba si el usuario está autenticado antes de permitir crear posts
     * Redirige al home si no está autenticado
     */
    checkAuthentication() {
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                // Si no hay usuario en la respuesta, redirigir al home
                if (!data.user) {
                    window.location.href = '/';
                }
            })
            .catch(error => {
                console.error('Error checking authentication:', error);
                window.location.href = '/';
            });
    }

    /**
     * CONFIGURACIÓN DE EVENT LISTENERS
     * Vincula todos los eventos necesarios para la funcionalidad del formulario
     */
    bindEvents() {
        // ================================
        // MANEJO DE IMAGEN DE PORTADA
        // ================================
        
        // Click en la sección de imagen de portada para abrir selector de archivos
        document.getElementById('coverImageSection').addEventListener('click', () => {
            document.getElementById('coverImageInput').click();
        });

        // Cambio en el input de archivo para manejar la imagen seleccionada
        document.getElementById('coverImageInput').addEventListener('change', (e) => {
            this.handleCoverImage(e.target.files[0]);
        });

        // ================================
        // MANEJO DE TAGS
        // ================================
        
        // Evento keydown para agregar tags con Enter o coma
        document.getElementById('postTags').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault(); // Prevenir comportamiento por defecto
                this.addTag();
            }
        });

        // Evento blur para agregar tag cuando el input pierde el foco
        document.getElementById('postTags').addEventListener('blur', () => {
            this.addTag();
        });

        // ================================
        // BOTONES DE LA BARRA DE HERRAMIENTAS
        // ================================
        
        // Configurar todos los botones de la toolbar de formato
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleToolbarClick(e.target.closest('button'));
            });
        });

        // ================================
        // ACCIONES DEL FORMULARIO
        // ================================
        
        // Botón Guardar Borrador
        document.getElementById('saveDraftBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.savePost(false); // false = no publicar, guardar como borrador
        });

        // Botón Publicar
        document.getElementById('publishBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.savePost(true); // true = publicar el post
        });
    }

    /**
     * MANEJO DE IMAGEN DE PORTADA
     * Valida y procesa la imagen de portada seleccionada
     * @param {File} file - Archivo de imagen seleccionado
     */
    handleCoverImage(file) {
        if (file) {
            // Validar que sea un archivo de imagen
            if (!file.type.startsWith('image/')) {
                this.showMessage('Please select an image file', 'error');
                return;
            }

            // Validar tamaño máximo (5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage('Image size must be less than 5MB', 'error');
                return;
            }

            // Crear FileReader para previsualizar la imagen
            const reader = new FileReader();
            
            // Cuando se cargue la imagen, actualizar la previsualización
            reader.onload = (e) => {
                const preview = document.getElementById('coverImagePreview');
                preview.src = e.target.result; // Establecer la imagen cargada
                preview.style.display = 'block'; // Mostrar la imagen
                
                // Ocultar el placeholder (ícono y texto)
                document.querySelector('#coverImageSection i').style.display = 'none';
                document.querySelector('#coverImageSection p').style.display = 'none';
            };
            
            // Leer el archivo como Data URL para la previsualización
            reader.readAsDataURL(file);
        }
    }

    /**
     * AGREGAR NUEVO TAG
     * Procesa y agrega un nuevo tag desde el input
     */
    addTag() {
        const input = document.getElementById('postTags');
        const tagText = input.value.trim().toLowerCase(); // Normalizar a minúsculas

        // Verificar que el tag no esté vacío
        if (tagText && tagText.length > 0) {
            // Verificar límite máximo de tags
            if (this.currentTags.length >= this.maxTags) {
                this.showMessage(`Maximum ${this.maxTags} tags allowed`, 'error');
                return;
            }

            // Verificar que el tag no exista ya
            if (this.currentTags.includes(tagText)) {
                this.showMessage('Tag already added', 'error');
                return;
            }

            // Agregar el tag al array y actualizar la UI
            this.currentTags.push(tagText);
            this.renderTags();
            input.value = ''; // Limpiar el input
        }
    }

    /**
     * ELIMINAR TAG
     * Remueve un tag específico del array
     * @param {string} tag - Tag a eliminar
     */
    removeTag(tag) {
        // Filtrar el array para excluir el tag especificado
        this.currentTags = this.currentTags.filter(t => t !== tag);
        this.renderTags(); // Actualizar la UI
    }

    /**
     * RENDERIZAR TAGS EN LA UI
     * Actualiza el contenedor de tags con los tags actuales
     */
    renderTags() {
        const container = document.getElementById('tagsContainer');
        container.innerHTML = ''; // Limpiar contenedor

        // Crear elemento HTML para cada tag
        this.currentTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove" onclick="createPost.removeTag('${tag}')">
                    <i class="fas fa-times"></i>
                </span>
            `;
            container.appendChild(tagElement);
        });
    }

    /**
     * MANEJO DE CLIC EN BARRA DE HERRAMIENTAS
     * Ejecuta comandos de formato en el editor de contenido
     * @param {HTMLButtonElement} button - Botón de la toolbar que fue clickeado
     */
    handleToolbarClick(button) {
        const command = button.dataset.command;
        const value = button.dataset.value;
        
        // Asegurar que el editor de contenido tenga el foco
        document.getElementById('postContent').focus();
        
        try {
            // Ejecutar comando de formato específico
            if (command === 'formatBlock' && value) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, null);
            }
        } catch (error) {
            console.error('Error executing command:', error);
        }
    }

    /**
     * GUARDAR/PUBLICAR POST
     * Envía el post al servidor para guardarlo como borrador o publicarlo
     * @param {boolean} publish - true para publicar, false para guardar como borrador
     */
    async savePost(publish = false) {
        // Obtener valores del formulario
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const coverImage = document.getElementById('coverImageInput').files[0];

        // ================================
        // VALIDACIONES
        // ================================
        
        // Validar título obligatorio
        if (!title) {
            this.showMessage('Post title is required', 'error');
            return;
        }

        // Validar contenido obligatorio
        if (!content) {
            this.showMessage('Post content is required', 'error');
            return;
        }

        // Validar longitud máxima del título
        if (title.length > 200) {
            this.showMessage('Title must be less than 200 characters', 'error');
            return;
        }

        // ================================
        // PREPARACIÓN DE DATOS
        // ================================
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('published', publish);
        formData.append('tags', this.currentTags.join(',')); // Convertir array a string separado por comas

        // Agregar imagen de portada si existe
        if (coverImage) {
            formData.append('coverImage', coverImage);
        }

        // ================================
        // ENVÍO AL SERVIDOR
        // ================================
        
        this.showLoading(true);
        this.hideMessages();

        try {
            // Realizar petición POST al endpoint de posts
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Éxito: mostrar mensaje y redirigir si se publicó
                this.showMessage(result.message, 'success');
                
                if (publish) {
                    setTimeout(() => {
                        window.location.href = '/index';
                    }, 1500);
                }
            } else {
                // Error del servidor: mostrar mensaje de error
                this.showMessage(result.error || 'Error creating post', 'error');
            }
        } catch (error) {
            // Error de red
            console.error('Error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            // Siempre ocultar loading indicator
            this.showLoading(false);
        }
    }

    /**
     * MOSTRAR MENSAJE AL USUARIO
     * Muestra mensajes de éxito o error en la interfaz
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje ('error' o 'success')
     */
    showMessage(message, type) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');

        if (type === 'error') {
            // Mostrar mensaje de error
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            successDiv.classList.add('hidden');
        } else {
            // Mostrar mensaje de éxito
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
        }

        // Auto-ocultar mensajes de éxito después de 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * OCULTAR TODOS LOS MENSAJES
     * Limpia la interfaz de mensajes de error y éxito
     */
    hideMessages() {
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('successMessage').classList.add('hidden');
    }

    /**
     * MOSTRAR/OCULTAR INDICADOR DE CARGA
     * Controla la visibilidad del loading indicator y estado de botones
     * @param {boolean} show - true para mostrar, false para ocultar
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        const publishBtn = document.getElementById('publishBtn');
        const saveDraftBtn = document.getElementById('saveDraftBtn');

        if (show) {
            // Mostrar loading y deshabilitar botones
            loading.classList.remove('hidden');
            publishBtn.disabled = true;
            saveDraftBtn.disabled = true;
        } else {
            // Ocultar loading y habilitar botones
            loading.classList.add('hidden');
            publishBtn.disabled = false;
            saveDraftBtn.disabled = false;
        }
    }
}

// Instancia global de la clase CreatePost
const createPost = new CreatePost();