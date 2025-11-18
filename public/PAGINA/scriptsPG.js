// =====================================================================
// SECCIÓN 1: DECLARACIÓN DE ELEMENTOS DEL DOM
// =====================================================================

/**
 * Esta sección contiene todas las referencias a elementos del DOM
 * que se utilizarán en toda la aplicación.
 * Se organizan por categorías para mejor mantenibilidad.
 */

// Elementos principales de la interfaz
const articlesEl = document.getElementById('articles'); // Contenedor principal de artículos
const loadingEl = document.getElementById('loading'); // Indicador de carga
const popularTagsEl = document.getElementById('popularTags'); // Lista de tags populares
const searchInput = document.getElementById('searchInput'); // Campo de búsqueda principal
const sortSelect = document.getElementById('sortSelect'); // Selector de ordenamiento

// Elementos de navegación y autenticación
const tabs = document.querySelectorAll('.tab'); // Pestañas de filtrado (latest, top, trending)
const authActions = document.getElementById('authActions'); // Contenedor de acciones para usuarios no autenticados
const userNav = document.getElementById('userNav'); // Contenedor de navegación para usuarios autenticados
const userAvatar = document.getElementById('userAvatar'); // Avatar del usuario en la barra superior
const dropdownAvatar = document.getElementById('dropdownAvatar'); // Avatar en el dropdown del usuario
const dropdownUsername = document.getElementById('dropdownUsername'); // Nombre de usuario en el dropdown
const dropdownEmail = document.getElementById('dropdownEmail'); // Email del usuario en el dropdown
const userDropdown = document.getElementById('userDropdown'); // Menú desplegable del usuario

// Elementos del menú responsive
const menuToggle = document.getElementById('menuToggle'); // Botón para toggle del menú móvil
const leftbar = document.getElementById('leftbar'); // Barra lateral izquierda
const minibar = document.getElementById('minibar'); // Barra lateral mini (íconos)

// =====================================================================
// SECCIÓN 2: SISTEMA DE AUTENTICACIÓN - AUTH MANAGER
// =====================================================================

/**
 * Clase principal que maneja toda la autenticación de la aplicación
 * Gestiona tokens JWT, estado de sesión y comunicación con el backend
 */
class AuthManager {
    constructor() {
        // Inicializar estado de autenticación desde localStorage
        this.token = localStorage.getItem('jwtToken');
        this.isAuthenticated = !!this.token; // Convertir a booleano
    }

    /**
     * Sincroniza el estado de autenticación entre diferentes sistemas
     * @returns {boolean} Estado actual de autenticación
     */
    syncAuthState() {
        console.log('🔄 Sincronizando estado de autenticacion...');

        // Verificar si hay token en localStorage pero no en authManager
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken && !this.token) {
            console.log('🔄 Token encontrado en localStorage, actualizando authManager');
            this.token = storedToken;
            this.isAuthenticated = true;
        }

        // Verificar si hay usuario en devCommunity pero authManager no está autenticado
        if (window.devCommunity && window.devCommunity.currentUser && !this.isAuthenticated) {
            console.log('🔄 Usuario encontrado en devCommunity, marcando como autenticado');
            this.isAuthenticated = true;
        }

        console.log('✅ Estado final de autenticacion:', {
            isAuthenticated: this.isAuthenticated,
            token: this.token ? 'PRESENTE' : 'AUSENTE',
            devCommunityUser: window.devCommunity?.currentUser ? 'PRESENTE' : 'AUSENTE'
        });

        return this.isAuthenticated;
    }

    /**
     * Genera headers de autenticación para requests HTTP
     * @returns {Object} Headers con token de autorización
     */
    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };
        }
        return { 'Content-Type': 'application/json' };
    }

    /**
     * Verifica la validez del token con el servidor
     * @returns {Promise<boolean>} True si el token es válido
     */
    async verifyToken() {
        if (!this.token) return false;
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error verificando token:', error);
            return false;
        }
    }

    /**
     * Establece el token JWT y actualiza el estado de autenticación
     * @param {string} token - Token JWT
     */
    setToken(token) {
        this.token = token;
        this.isAuthenticated = true;
        localStorage.setItem('jwtToken', token);
    }

    /**
     * Elimina el token JWT (logout parcial)
     */
    clearToken() {
        console.log("🗑 Eliminando token JWT...");
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('jwtToken');
    }

    /**
     * Elimina cookies de autenticación del navegador
     */
    clearAuthCookies() {
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    /**
     * Limpia todos los datos del usuario del almacenamiento local
     */
    clearAllUserData() {
        console.log("🧹 Limpiando todos los datos del usuario...");

        // Limpiar localStorage
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userLoggedIn');

        // Limpiar sessionStorage
        sessionStorage.clear();
        
        // Limpiar cookies
        this.clearAuthCookies();

        // Resetear estado interno
        this.token = null;
        this.isAuthenticated = false;

        console.log("✔ Datos de usuario completamente eliminados");
    }

    /**
     * Limpia la cache de la aplicación
     */
    clearAllCache() {
        // Limpiar cache de comentarios si existe
        if (window.devCommunity && window.devCommunity.commentSystem) {
            window.devCommunity.commentSystem.commentsCache.clear();
        }

        // Limpiar variables globales
        window.currentUser = null;
        window.userData = null;

        console.log("🧹 Cache limpiada");
    }

    /**
     * Realiza el logout completo del usuario
     * Invalida el token en el servidor y limpia todos los datos locales
     */
    async logout() {
        try {
            console.log("🚪 Iniciando logout...");

            // Guardar token temporalmente antes de borrarlo para invalidación en servidor
            const tokenToInvalidate = this.token;

            // 1. Limpiar datos locales inmediatamente
            this.clearAllUserData();

            // 2. Intentar logout en backend si existía token
            if (tokenToInvalidate) {
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${tokenToInvalidate}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log("✔ Logout en servidor completado");
                } catch (error) {
                    console.log("❌ Error en logout del servidor, pero continuando...");
                }
            }

            // 3. Limpiar cache de la aplicación
            this.clearAllCache();

            // 4. Redirigir al login
            window.location.href = '/login.html';

        } catch (error) {
            console.error("❌ Error en logout:", error);
            // Fallback: limpiar todo y redirigir
            this.clearAllUserData();
            window.location.href = '/login.html';
        }
    }
}

// =====================================================================
// SECCIÓN 3: SISTEMA MEJORADO DE MANEJO DE IMÁGENES DE PERFIL
// =====================================================================

/**
 * Clase especializada en el manejo de imágenes de perfil
 * Soporta múltiples proveedores OAuth (Google, GitHub, Facebook)
 * y proporciona fallbacks robustos
 */
class ProfileImageManager {
    constructor() {
        this.defaultAvatar = '/IMAGENES/default-avatar.png'; // Avatar por defecto
    }

    /**
     * Normaliza la URL de la imagen de perfil para diferentes proveedores
     * @param {string} profilePicture - URL original de la imagen
     * @param {Object} userData - Datos del usuario para contexto
     * @returns {string} URL normalizada de la imagen
     */
    normalizeProfilePicture(profilePicture, userData = null) {
        // Validar entrada
        if (!profilePicture || profilePicture === 'null' || profilePicture === 'undefined') {
            return this.defaultAvatar;
        }

        console.log('🖼️ Procesando imagen de perfil:', {
            original: profilePicture,
            userData: userData
        });

        // Si ya es una URL completa y válida
        if (profilePicture.startsWith('http')) {
            return this.processOAuthImage(profilePicture, userData);
        }

        // Si es una ruta relativa
        if (profilePicture.startsWith('/')) {
            return profilePicture;
        }

        // Fallback al avatar por defecto
        return this.defaultAvatar;
    }

    /**
     * Procesa imágenes de proveedores OAuth específicos
     * @param {string} url - URL de la imagen OAuth
     * @param {Object} userData - Datos del usuario
     * @returns {string} URL procesada
     */
    processOAuthImage(url, userData) {
        try {
            // GOOGLE - Asegurar tamaño adecuado y formato
            if (url.includes('googleusercontent.com')) {
                return this.processGoogleImage(url);
            }

            // GITHUB - Ya funciona bien
            if (url.includes('githubusercontent.com')) {
                return url;
            }

            // FACEBOOK - Ya funciona bien  
            if (url.includes('fbcdn.net') || url.includes('facebook.com')) {
                return url;
            }

            // Imagen genérica - asegurar que sea accesible
            return this.ensureImageAccessibility(url);

        } catch (error) {
            console.error('❌ Error procesando imagen OAuth:', error);
            return this.defaultAvatar;
        }
    }

    /**
     * Procesa específicamente imágenes de Google OAuth
     * @param {string} googleUrl - URL de imagen de Google
     * @returns {string} URL optimizada de Google
     */
    processGoogleImage(googleUrl) {
        console.log('🔧 Procesando imagen de Google:', googleUrl);
        
        try {
            // Si ya tiene parámetros de tamaño, dejarla como está
            if (googleUrl.includes('=s96-c') || googleUrl.includes('=s100') || googleUrl.includes('=s200')) {
                return googleUrl;
            }

            // Si es la URL básica de Google, agregar parámetro de tamaño
            if (googleUrl.includes('googleusercontent.com/a/')) {
                // Para URLs de Google Workspace - asegurar acceso público
                return googleUrl.replace('/a/', '/a/s100/') + '?authuser=0';
            }

            // Para URLs regulares de Google, agregar parámetro de tamaño
            if (!googleUrl.includes('=')) {
                return googleUrl + '=s100-c';
            }

            // Si ya tiene parámetros pero no de tamaño, agregar el nuestro
            if (googleUrl.includes('?')) {
                return googleUrl + '&sz=100';
            }

            return googleUrl;

        } catch (error) {
            console.error('❌ Error procesando imagen Google:', error);
            return googleUrl; // Devolver original si hay error
        }
    }

    /**
     * Asegura que la imagen sea accesible y evita problemas de cache
     * @param {string} url - URL original de la imagen
     * @returns {string} URL con parámetros de cache
     */
    ensureImageAccessibility(url) {
        // Agregar timestamp para evitar cache si es necesario
        if (url.includes('googleusercontent.com')) {
            // Para Google, agregar parámetro de no-cache
            return url + (url.includes('?') ? '&' : '?') + 'timestamp=' + new Date().getTime();
        }
        
        return url;
    }

    /**
     * Configura un elemento img con manejo de errores y reintentos
     * @param {HTMLImageElement} imgElement - Elemento imagen a configurar
     * @param {string} src - URL de la imagen
     * @param {string} alt - Texto alternativo
     * @param {number} maxRetries - Número máximo de reintentos
     */
    setupImageWithRetry(imgElement, src, alt = 'User Avatar', maxRetries = 2) {
        let retries = 0;
        
        // Usar la URL normalizada
        const normalizedSrc = this.normalizeProfilePicture(src);
        imgElement.src = normalizedSrc;
        imgElement.alt = alt;
        
        /**
         * Maneja errores de carga con reintentos automáticos
         */
        const handleError = () => {
            retries++;
            console.warn(`🖼️ Error cargando imagen (intento ${retries}/${maxRetries}):`, normalizedSrc);
            
            if (retries <= maxRetries) {
                // Reintentar con timestamp diferente para evitar cache
                const timestamp = new Date().getTime();
                const retrySrc = normalizedSrc + (normalizedSrc.includes('?') ? '&' : '?') + `retry=${timestamp}`;
                imgElement.src = retrySrc;
            } else {
                // Usar imagen por defecto después de todos los reintentos
                imgElement.src = this.defaultAvatar;
                imgElement.alt = 'Default Avatar';
                console.log('🖼️ Usando imagen por defecto después de reintentos');
            }
        };

        // Configurar event handlers
        imgElement.onerror = handleError;
        imgElement.onload = () => {
            console.log('✅ Imagen cargada exitosamente:', normalizedSrc);
        };
    }
}

// Instancia global del ProfileImageManager
const profileImageManager = new ProfileImageManager();

// Instancia global del AuthManager
const authManager = new AuthManager();

// =====================================================================
// SECCIÓN 4: NAVEGACIÓN RESPONSIVE
// =====================================================================

/**
 * Sistema completo de navegación responsive
 * Maneja el menú móvil, overlays y comportamientos táctiles
 */
document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menuToggle');
    const leftbar = document.getElementById('leftbar');
    const body = document.body;

    // Crear overlay móvil si no existe
    let mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobileOverlay';
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
    }

    let isMenuOpen = false;

    /**
     * Abre el menú móvil con animación
     */
    function openMobileMenu() {
        leftbar.classList.add('open');
        mobileOverlay.classList.add('active');
        body.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.innerHTML = '✕'; // Icono de cerrar
        isMenuOpen = true;
    }

    /**
     * Cierra el menú móvil con animación
     */
    function closeMobileMenu() {
        leftbar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '☰'; // Icono de hamburguesa
        isMenuOpen = false;
    }

    // Configurar toggle del menú
    if (menuToggle) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevenir burbujeo
            isMenuOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    // Cerrar menú al hacer clic en el overlay
    mobileOverlay.addEventListener('click', closeMobileMenu);

    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isMenuOpen) closeMobileMenu();
    });

    // Cerrar menú al hacer clic en enlaces móviles
    const mobileLinks = leftbar.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function () {
            // Solo cerrar para navegación interna
            if (!this.href.startsWith('http') && window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    // Cerrar menú al redimensionar a desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && isMenuOpen) closeMobileMenu();
        updateHamburgerVisibility();
    });

    // Prevenir cierre al hacer clic dentro del menú
    leftbar.addEventListener('click', e => e.stopPropagation());

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (isMenuOpen && !leftbar.contains(e.target) && e.target !== menuToggle) {
            closeMobileMenu();
        }
    });

    /**
     * Actualiza el estado de la interfaz según autenticación
     */
    function updateUserState() {
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const userNav = document.getElementById('userNav');
        const authActions = document.getElementById('authActions');

        if (isLoggedIn) {
            body.classList.add('user-logged-in');
            body.classList.remove('user-logged-out');
            if (userNav) userNav.style.display = 'flex';
            if (authActions) authActions.style.display = 'none';
        } else {
            body.classList.add('user-logged-out');
            body.classList.remove('user-logged-in');
            if (userNav) userNav.style.display = 'none';
            if (authActions) authActions.style.display = 'flex';
        }
    }

    /**
     * Actualiza visibilidad del botón hamburguesa
     */
    function updateHamburgerVisibility() {
        menuToggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        if (window.innerWidth > 768) closeMobileMenu();
    }

    /**
     * Inicializa el sistema de navegación
     */
    function initialize() {
        updateUserState();
        updateHamburgerVisibility();
    }

    // Inicializar y configurar listeners
    initialize();
    window.addEventListener('resize', updateHamburgerVisibility);
});

// =====================================================================
// SECCIÓN 5: MODAL DE LOGOUT
// =====================================================================

/**
 * Maneja el modal de confirmación para logout
 * Proporciona una experiencia de usuario segura para cerrar sesión
 */

// Función global para mostrar el modal de logout
window.handleLogout = function (event) {
    if (event) event.preventDefault(); // Prevenir comportamiento por defecto
    const logoutModal = document.getElementById('logoutModal');
    logoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
};

// Configuración del modal de logout
document.addEventListener('DOMContentLoaded', function () {
    const logoutModal = document.getElementById('logoutModal');
    const logoutConfirm = document.getElementById('logoutConfirm');
    const logoutCancel = document.getElementById('logoutCancel');
    const modalOverlay = logoutModal.querySelector('.modal__overlay');

    // Confirmar logout
    if (logoutConfirm) {
        logoutConfirm.addEventListener('click', async function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
            await authManager.logout(); // Ejecutar logout completo
        });
    }

    // Cancelar logout
    if (logoutCancel) {
        logoutCancel.addEventListener('click', function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // Cerrar modal al hacer clic en el overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && logoutModal.style.display === 'flex') {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});

// =====================================================================
// SECCIÓN 6: SISTEMA DE REQUESTS AUTENTICADOS
// =====================================================================

/**
 * Funciones para realizar requests HTTP autenticados
 * Manejan automáticamente tokens JWT y refresh de tokens
 */

/**
 * Realiza una request HTTP autenticada con manejo automático de tokens
 * @param {string} url - Endpoint de la API
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Response>} Response de la request
 */
async function makeAuthenticatedRequest(url, options = {}) {
    // Obtener headers de autenticación
    const authHeaders = authManager.getAuthHeaders();

    // Combinar configuraciones
    const config = {
        ...options,
        headers: {
            ...authHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        // Si el token expiró, intentar refresh
        if (response.status === 401 && authManager.token) {
            console.log('Token expirado, intentando refresh...');
            const refreshed = await refreshToken();
            if (refreshed) {
                // Reintentar request con nuevo token
                config.headers.Authorization = `Bearer ${authManager.token}`;
                return await fetch(url, config);
            }
        }

        return response;
    } catch (error) {
        console.error('Error en request autenticado:', error);
        throw error;
    }
}

/**
 * Refresca el token JWT usando el refresh token
 * @returns {Promise<boolean>} True si el refresh fue exitoso
 */
async function refreshToken() {
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authManager.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            authManager.setToken(data.token);
            return true;
        }
    } catch (error) {
        console.error('Error refrescando token:', error);
    }

    // Si el refresh falla, hacer logout
    authManager.clearToken();
    window.location.href = '/';
    return false;
}

// =====================================================================
// SECCIÓN 7: SISTEMA DE AVATARS E INTERFAZ DE AUTENTICACIÓN
// =====================================================================

/**
 * Funciones para manejar la interfaz de usuario relacionada con autenticación
 * Actualizan la UI según el estado de autenticación del usuario
 */

/**
 * Maneja errores de carga de imágenes de avatar
 * @param {HTMLImageElement} img - Elemento imagen que falló
 */
function handleImageError(img) {
    img.src = '/IMAGENES/default-avatar.png';
    img.alt = 'Default Avatar';
}

/**
 * Configura manejadores de errores para todas las imágenes de avatar
 */
function setupImageErrorHandlers() {
    if (userAvatar) userAvatar.addEventListener('error', () => handleImageError(userAvatar));
    if (dropdownAvatar) dropdownAvatar.addEventListener('error', () => handleImageError(dropdownAvatar));
}

/**
 * Verifica el estado de autenticación con el servidor
 * @returns {Promise<Object|null>} Datos del usuario o null si no autenticado
 */
async function checkAuth() {
    try {
        console.log('🔐 Verificando estado de autenticacion...');

        const token = localStorage.getItem('jwtToken');

        // Verificar si hay token
        if (!token) {
            console.log('❌ No hay token');
            showUnauthenticatedState();
            return null;
        }

        // Verificar token con el servidor
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.log('❌ Token invalido');
            clearAllUserData();
            showUnauthenticatedState();
            return null;
        }

        const data = await response.json();

        // Verificar estructura de respuesta
        if (data.user && data.user.id) {
            showAuthenticatedState(data.user);
            return data.user;
        }

        showUnauthenticatedState();
        return null;

    } catch (error) {
        console.error('❌ Error en checkAuth:', error);
        clearAllUserData();
        showUnauthenticatedState();
        return null;
    }
}

/**
 * Muestra la interfaz para usuario autenticado
 * @param {Object} user - Datos del usuario
 */
function showAuthenticatedState(user) {
    // Mostrar navegación de usuario y ocultar acciones de auth
    if (authActions) authActions.style.display = 'none';
    if (userNav) userNav.style.display = 'flex';

    // Obtener imagen de perfil o usar default
    const profilePic = user.profilePicture || user.avatar || '/IMAGENES/default-avatar.png';

    // Actualizar avatars
    if (userAvatar) {
        userAvatar.src = profilePic;
        userAvatar.alt = user.username;
    }

    if (dropdownAvatar) {
        dropdownAvatar.src = profilePic;
        dropdownAvatar.alt = user.username;
    }

    // Actualizar información del usuario
    if (dropdownUsername) dropdownUsername.textContent = user.username;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
}

/**
 * Muestra la interfaz para usuario no autenticado
 */
function showUnauthenticatedState() {
    // Mostrar acciones de auth y ocultar navegación de usuario
    if (authActions) authActions.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
    resetUserInfo();
}

/**
 * Resetea la información del usuario en la interfaz
 */
function resetUserInfo() {
    const defaultAvatar = '/IMAGENES/default-avatar.png';
    if (userAvatar) userAvatar.src = defaultAvatar;
    if (dropdownAvatar) dropdownAvatar.src = defaultAvatar;
    if (dropdownUsername) dropdownUsername.textContent = 'Username';
    if (dropdownEmail) dropdownEmail.textContent = 'user@example.com';
}

/**
 * Limpia todos los datos de usuario del almacenamiento
 */
function clearAllUserData() {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    sessionStorage.clear();
}

// =====================================================================
// SECCIÓN 8: DROPDOWN DEL USUARIO
// =====================================================================

/**
 * Inicializa la funcionalidad del dropdown del usuario
 * Maneja la apertura/cierre del menú desplegable
 */
function initUserDropdown() {
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    const userNav = document.getElementById('userNav');

    // Verificar que todos los elementos existan
    if (!userAvatar || !userDropdown || !userNav) {
        console.log('User dropdown elements not found:', {
            userAvatar: !!userAvatar,
            userDropdown: !!userDropdown,
            userNav: !!userNav
        });
        return;
    }

    console.log('Initializing user dropdown...');

    // Configuración inicial del dropdown
    userDropdown.style.display = 'none';
    userDropdown.style.position = 'absolute';
    userDropdown.style.top = '100%';
    userDropdown.style.right = '0';
    userDropdown.style.zIndex = '1000';

    // Toggle del dropdown al hacer clic en el avatar
    userAvatar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isVisible = userDropdown.style.display === 'block';
        userDropdown.style.display = isVisible ? 'none' : 'block';

        console.log('User dropdown toggled:', !isVisible ? 'visible' : 'hidden');
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (userDropdown.style.display === 'block') {
            const isClickInsideDropdown = userDropdown.contains(e.target);
            const isClickOnAvatar = userAvatar.contains(e.target);

            if (!isClickInsideDropdown && !isClickOnAvatar) {
                userDropdown.style.display = 'none';
                console.log('User dropdown closed (click outside)');
            }
        }
    });

    // Prevenir que se cierre al hacer clic dentro del dropdown
    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userDropdown.style.display === 'block') {
            userDropdown.style.display = 'none';
            console.log('User dropdown closed (Escape key)');
        }
    });

    console.log('User dropdown initialized successfully');
}

// =====================================================================
// SECCIÓN 9: SISTEMA DE TAGS
// =====================================================================

/**
 * Renderiza la lista de tags populares y configura su funcionalidad
 */
function renderTags() {
    if (!popularTagsEl) return;

    // Tags populares predefinidos
    const popularTags = ['javascript', 'webdev', 'python', 'devops', 'react', 'nodejs', 'ai', 'machinelearning'];

    // Limpiar contenedor
    popularTagsEl.innerHTML = '';
    
    // Crear elementos de tag
    popularTags.forEach(tag => {
        const li = document.createElement('li');
        li.className = 'taglist__item';
        li.innerHTML = `<a href="#" class="taglist__link" data-tag="${tag}">#${tag}</a>`;
        popularTagsEl.appendChild(li);
    });

    // Configurar búsqueda al hacer clic en un tag
    popularTagsEl.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const tag = a.dataset.tag;
        if (searchInput) {
            searchInput.value = tag;
            if (window.devCommunity) {
                window.devCommunity.doSearch(tag);
            }
        }
    });
}

// =====================================================================
// SECCIÓN 10: FUNCIONALIDAD DE LA MINIBAR
// =====================================================================

/**
 * Inicializa la funcionalidad de la minibar (barra lateral con íconos)
 * Maneja los previews que aparecen al hacer hover sobre los íconos
 */
function initMinibar() {
    const minibarItems = document.querySelectorAll('.minibar__item');

    minibarItems.forEach(item => {
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');

        // Mostrar preview al hacer hover
        link.addEventListener('mouseenter', () => {
            minibarItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('minibar__item--preview');
                }
            });
            item.classList.add('minibar__item--preview');
        });

        // Ocultar preview al quitar el mouse
        item.addEventListener('mouseleave', () => {
            item.classList.remove('minibar__item--preview');
        });
    });
}

// =====================================================================
// SECCIÓN 11: SISTEMA DE COMENTARIOS - CLASE PRINCIPAL
// =====================================================================

/**
 * Clase que maneja todo el sistema de comentarios
 * Incluye creación, edición, eliminación y likes de comentarios
 */
class CommentSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity; // Referencia a la app principal
        this.commentsCache = new Map(); // Cache para comentarios
        this.debug = true; // Modo debug
    }

    /**
     * Logging para debugging del sistema de comentarios
     * @param {string} message - Mensaje a loguear
     * @param {*} data - Datos adicionales
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[CommentSystem] ${message}`, data);
            } else {
                console.log(`[CommentSystem] ${message}`);
            }
        }
    }

    /**
     * Muestra/oculta la sección de comentarios de un post
     * @param {string} postId - ID del post
     */
    async toggleComments(postId) {
        this.log(`toggleComments called for post: ${postId}`);

        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) {
            console.error(`Comments section not found for post: ${postId}`);
            return;
        }

        const isVisible = commentsSection.style.display !== 'none';
        this.log(`Comments section visible: ${isVisible}`);

        if (!isVisible) {
            // Cargar y mostrar comentarios
            await this.loadComments(postId);
            commentsSection.style.display = 'block';

            // Animación de entrada
            commentsSection.style.opacity = '0';
            commentsSection.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                commentsSection.style.transition = 'all 0.3s ease';
                commentsSection.style.opacity = '1';
                commentsSection.style.transform = 'translateY(0)';
            }, 10);

        } else {
            // Animación de salida
            commentsSection.style.transition = 'all 0.3s ease';
            commentsSection.style.opacity = '0';
            commentsSection.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                commentsSection.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Carga los comentarios de un post desde la API o cache
     * @param {string} postId - ID del post
     */
    async loadComments(postId) {
        try {
            this.log(`Loading comments for post: ${postId}`);

            // Verificar cache primero
            if (this.commentsCache.has(postId)) {
                const cachedComments = this.commentsCache.get(postId);
                this.log(`Using cached comments: ${cachedComments.length} comments`);
                this.renderComments(postId, cachedComments);
                return;
            }

            // Cargar desde API
            const response = await fetch(`/api/posts/${postId}/comments`);

            // Manejar endpoint no disponible
            if (response.status === 404) {
                this.log('Comments endpoint not available (404), using empty comments');
                this.commentsCache.set(postId, []);
                this.renderComments(postId, []);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.log('Comments API response received', data);

            let comments = [];

            // Manejar diferentes formatos de respuesta
            if (data.success && data.comments) {
                comments = data.comments;
            } else if (data.comments) {
                comments = data.comments;
            } else if (Array.isArray(data)) {
                comments = data;
            }

            this.log(`Loaded ${comments.length} comments from API`);

            // Cachear comentarios
            this.commentsCache.set(postId, comments);
            this.renderComments(postId, comments);

        } catch (error) {
            console.error('Error loading comments:', error);
            this.log('Error loading comments, using empty array');
            this.commentsCache.set(postId, []);
            this.renderComments(postId, []);
        }
    }

    /**
     * Renderiza los comentarios en el contenedor correspondiente
     * @param {string} postId - ID del post
     * @param {Array} comments - Array de comentarios
     */
    renderComments(postId, comments) {
        const container = document.getElementById(`comments-container-${postId}`);
        if (!container) {
            console.error(`Comments container not found for post: ${postId}`);
            return;
        }

        this.log(`Rendering ${comments.length} comments for post: ${postId}`);

        if (comments.length === 0) {
            container.innerHTML = `
                <section class="no-comments">
                    <i class="fas fa-comments" style="font-size: 32px; color: #ccc; margin-bottom: 8px;"></i>
                    <p>No comments yet. Be the first to comment!</p>
                </section>
            `;
            return;
        }

        // Renderizar todos los comentarios
        container.innerHTML = comments.map(comment => this.createCommentHTML(comment)).join('');

        this.log(`Successfully rendered ${comments.length} comments`);
    }

    /**
     * Crea el HTML para un comentario individual
     * @param {Object} comment - Datos del comentario
     * @returns {string} HTML del comentario
     */
    createCommentHTML(comment) {
        if (!comment) {
            console.warn('Invalid comment:', comment);
            return '';
        }

        this.log('Creating HTML for comment', comment);

        // Extraer datos del comentario con manejo de diferentes formatos
        const user = comment.userId || comment.user || comment.author || {};
        const commentDate = comment.createdAt ?
            new Date(comment.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Recently';

        const username = user.username || user.name || 'Anonymous User';
        const profilePicture = user.profilePicture || user.avatar || '/IMAGENES/default-avatar.png';

        // Verificar si el comentario es del usuario actual
        let isCurrentUser = false;
        if (this.devCommunity.currentUser) {
            const currentUserId = this.devCommunity.currentUser.id || this.devCommunity.currentUser._id;
            const commentUserId = user._id || user.id;
            isCurrentUser = currentUserId === commentUserId;
            this.log(`Comment ownership check - Current: ${currentUserId}, Comment: ${commentUserId}, IsOwner: ${isCurrentUser}`);
        }

        const commentId = comment._id || comment.id;

        return `
            <article class="comment" data-comment-id="${commentId}">
                <img src="${profilePicture}" alt="${username}" class="comment__avatar" onerror="this.src='/IMAGENES/default-avatar.png'">
                <section class="comment__content">
                    <header class="comment__header">
                        <section class="comment__user-info">
                            <span class="comment__username">${username}</span>
                            ${isCurrentUser ? '<span class="comment__badge">You</span>' : ''}
                        </section>
                        <nav class="comment__actions">
                            <time class="comment__date">${commentDate}</time>
                            ${isCurrentUser ? `
                                <button class="comment__action-btn" onclick="devCommunity.commentSystem.editComment('${commentId}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="comment__action-btn comment__action-btn--danger" onclick="devCommunity.commentSystem.deleteComment('${commentId}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </nav>
                    </header>
                    <section class="comment__text">${this.escapeHtml(comment.content || comment.text || '')}</section>
                    
                    ${comment.editedAt ? `
                        <footer class="comment__edited">
                            <small>Edited ${new Date(comment.editedAt).toLocaleDateString()}</small>
                        </footer>
                    ` : ''}
                    
                    <footer class="comment__footer">
                        <button class="comment__like-btn ${comment.hasLiked ? 'comment__like-btn--active' : ''}" 
                                onclick="devCommunity.commentSystem.toggleCommentLike('${commentId}')">
                            <i class="fas fa-heart"></i>
                            <span class="comment__like-count">${comment.likesCount || comment.likes || 0}</span>
                        </button>
                    </footer>
                </section>
            </article>
        `;
    }

    /**
     * Agrega un nuevo comentario a un post
     * @param {string} postId - ID del post
     */
    async addComment(postId) {
        // Verificar autenticación
        if (!this.devCommunity.currentUser) {
            window.location.href = '/Login.html';
            return;
        }

        const commentInput = document.getElementById(`comment-input-${postId}`);
        const content = commentInput?.value.trim();

        // Validaciones
        if (!content) {
            this.showCommentError(postId, 'Comment cannot be empty');
            return;
        }

        if (content.length > 1000) {
            this.showCommentError(postId, 'Comment must be less than 1000 characters');
            return;
        }

        try {
            this.log(`Adding comment to post: ${postId}`, { content });

            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            const data = await response.json();
            this.log('Add comment API response', data);

            // Manejar errores del servidor
            if (!response.ok) {
                await this.verifyAndHandleCommentCreation(postId, content, commentInput);
                return;
            }

            // Manejar éxito
            this.handleCommentSuccess(postId, data, commentInput);

        } catch (error) {
            console.error('Error adding comment:', error);
            await this.verifyAndHandleCommentCreation(postId, content, commentInput);
        }
    }

    /**
     * Verifica si un comentario se creó exitosamente a pesar de errores del servidor
     * @param {string} postId - ID del post
     * @param {string} content - Contenido del comentario
     * @param {HTMLTextAreaElement} commentInput - Elemento input del comentario
     */
    async verifyAndHandleCommentCreation(postId, content, commentInput) {
        try {
            this.log('Verifying if comment was created despite server error...');

            // Esperar para dar tiempo al servidor
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar comentarios para verificar
            this.commentsCache.delete(postId);
            await this.loadComments(postId);

            const currentComments = this.commentsCache.get(postId) || [];
            this.log(`Current comments after verification: ${currentComments.length}`);

            // Buscar nuestro comentario
            const newCommentExists = currentComments.some(comment =>
                comment.content === content ||
                (comment.content && comment.content.includes(content.substring(0, 50)))
            );

            if (newCommentExists) {
                this.log('Comment was successfully created despite server error');
                this.handleCommentSuccess(postId, null, commentInput);
            } else {
                this.showCommentError(postId, 'Error adding comment to database. Please try again.');
            }
        } catch (verifyError) {
            console.error('Error verifying comment creation:', verifyError);
            this.showCommentError(postId, 'Error adding comment. Please try again.');
        }
    }

    /**
     * Maneja el éxito en la creación de un comentario
     * @param {string} postId - ID del post
     * @param {Object} commentData - Datos del comentario creado
     * @param {HTMLTextAreaElement} commentInput - Elemento input
     */
    handleCommentSuccess(postId, commentData, commentInput) {
        this.log('Handling comment success', { postId, commentData });

        // Limpiar input
        if (commentInput) commentInput.value = '';

        // Recargar comentarios
        this.commentsCache.delete(postId);
        this.loadComments(postId);

        // Actualizar contador
        this.updateCommentCount(postId, 1);

        this.showCommentSuccess(postId, 'Comment added successfully!');
    }

    /**
     * Inicia el modo edición para un comentario
     * @param {string} commentId - ID del comentario
     */
    async editComment(commentId) {
        this.log(`Edit comment: ${commentId}`);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const commentText = commentElement.querySelector('.comment__text');
        const currentContent = commentText.textContent;

        // Crear formulario de edición
        commentText.innerHTML = `
            <section class="comment-edit-form">
                <textarea class="comment-edit-input" rows="3">${this.escapeHtml(currentContent)}</textarea>
                <nav class="comment-edit-actions">
                    <button class="btn btn--small btn--primary" onclick="devCommunity.commentSystem.saveCommentEdit('${commentId}')">
                        Save
                    </button>
                    <button class="btn btn--small btn--secondary" onclick="devCommunity.commentSystem.cancelCommentEdit('${commentId}')">
                        Cancel
                    </button>
                </nav>
            </section>
        `;

        // Configurar textarea
        const textarea = commentText.querySelector('.comment-edit-input');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    /**
     * Guarda los cambios de un comentario editado
     * @param {string} commentId - ID del comentario
     */
    async saveCommentEdit(commentId) {
        this.log(`Save comment edit: ${commentId}`);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const textarea = commentElement.querySelector('.comment-edit-input');
        const newContent = textarea.value.trim();

        // Validaciones
        if (!newContent) {
            this.showMessage('Comment cannot be empty', 'error');
            return;
        }

        if (newContent.length > 1000) {
            this.showMessage('Comment must be less than 1000 characters', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Recargar comentarios desde servidor
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId);
                        await this.loadComments(postId);
                    }
                    this.showMessage('Comment updated successfully!', 'success');
                } else {
                    throw new Error('Failed to update comment');
                }
            } else {
                // Fallback: edición local
                this.handleLocalCommentEdit(commentId, newContent);
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            this.handleLocalCommentEdit(commentId, newContent);
        }
    }

    /**
     * Maneja la edición de comentarios localmente (fallback)
     * @param {string} commentId - ID del comentario
     * @param {string} newContent - Nuevo contenido
     */
    handleLocalCommentEdit(commentId, newContent) {
        this.log(`Handling local comment edit: ${commentId}`);

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const postId = this.getPostIdFromComment(commentId);
        if (!postId) return;

        // Actualizar en cache
        const currentComments = this.commentsCache.get(postId) || [];
        const updatedComments = currentComments.map(comment => {
            const id = comment._id || comment.id;
            if (id === commentId) {
                return {
                    ...comment,
                    content: newContent,
                    editedAt: new Date().toISOString()
                };
            }
            return comment;
        });

        this.commentsCache.set(postId, updatedComments);
        this.renderComments(postId, updatedComments);

        this.showMessage('Comment updated successfully! (local)', 'success');
    }

    /**
     * Cancela la edición de un comentario
     * @param {string} commentId - ID del comentario
     */
    cancelCommentEdit(commentId) {
        this.log(`Cancel comment edit: ${commentId}`);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        // Recargar para cancelar cambios
        const postId = this.getPostIdFromComment(commentId);
        if (postId) {
            this.loadComments(postId);
        }
    }

    /**
     * Elimina un comentario
     * @param {string} commentId - ID del comentario
     */
    async deleteComment(commentId) {
        this.log(`Delete comment: ${commentId}`);

        // Confirmación
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Recargar desde servidor
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId);
                        await this.loadComments(postId);
                        this.updateCommentCount(postId, -1);
                    }
                    this.showMessage('Comment deleted successfully!', 'success');
                } else {
                    throw new Error('Failed to delete comment');
                }
            } else {
                // Fallback: eliminación local
                this.handleLocalCommentDelete(commentId);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.handleLocalCommentDelete(commentId);
        }
    }

    /**
     * Maneja la eliminación de comentarios localmente (fallback)
     * @param {string} commentId - ID del comentario
     */
    handleLocalCommentDelete(commentId) {
        this.log(`Handling local comment deletion: ${commentId}`);

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) {
            this.log('Comment element not found for deletion');
            return;
        }

        const postId = this.getPostIdFromComment(commentId);
        if (!postId) {
            this.log('Post ID not found for comment deletion');
            return;
        }

        // Eliminar de cache
        const currentComments = this.commentsCache.get(postId) || [];
        this.log(`Current comments before deletion: ${currentComments.length}`);

        const updatedComments = currentComments.filter(comment => {
            const id = comment._id || comment.id;
            return id !== commentId;
        });

        this.log(`Comments after deletion: ${updatedComments.length}`);

        this.commentsCache.set(postId, updatedComments);
        this.renderComments(postId, updatedComments);
        this.updateCommentCount(postId, -1);

        this.showMessage('Comment deleted successfully! (local)', 'success');
    }

    /**
     * Alterna el like de un comentario
     * @param {string} commentId - ID del comentario
     */
    async toggleCommentLike(commentId) {
        this.log(`Toggle comment like: ${commentId}`);
        if (!this.devCommunity.currentUser) {
            window.location.href = '/Login.html';
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Recargar para mostrar like actualizado
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId);
                        await this.loadComments(postId);
                    }
                } else {
                    throw new Error('Failed to toggle like');
                }
            } else {
                // Fallback: like local
                this.handleLocalCommentLike(commentId);
            }
        } catch (error) {
            console.error('Error toggling comment like:', error);
            this.handleLocalCommentLike(commentId);
        }
    }

    /**
     * Maneja los likes de comentarios localmente (fallback)
     * @param {string} commentId - ID del comentario
     */
    handleLocalCommentLike(commentId) {
        this.log(`Handling local comment like: ${commentId}`);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const likeBtn = commentElement.querySelector('.comment__like-btn');
        const likeCount = commentElement.querySelector('.comment__like-count');

        if (likeBtn && likeCount) {
            const isActive = likeBtn.classList.contains('comment__like-btn--active');
            const currentCount = parseInt(likeCount.textContent) || 0;

            likeBtn.classList.toggle('comment__like-btn--active', !isActive);
            likeCount.textContent = isActive ? currentCount - 1 : currentCount + 1;

            this.showMessage('Like updated! (local)', 'success');
        }
    }

    /**
     * Actualiza el contador de comentarios de un post
     * @param {string} postId - ID del post
     * @param {number} change - Cambio en el contador (+1 o -1)
     */
    updateCommentCount(postId, change) {
        this.log(`Updating comment count for post ${postId}: change = ${change}`);

        const commentsBtn = document.querySelector(`[data-post-id="${postId}"] .article-card__comments-btn span`);
        if (commentsBtn) {
            const currentCount = parseInt(commentsBtn.textContent) || 0;
            const newCount = Math.max(0, currentCount + change);
            commentsBtn.textContent = newCount;
            this.log(`Comment count updated: ${currentCount} -> ${newCount}`);
        } else {
            this.log('Comment count button not found');
        }
    }

    /**
     * Obtiene el ID del post a partir del ID de un comentario
     * @param {string} commentId - ID del comentario
     * @returns {string|null} ID del post o null si no se encuentra
     */
    getPostIdFromComment(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) {
            this.log(`Comment element not found for ID: ${commentId}`);
            return null;
        }

        const commentsSection = commentElement.closest('.article-card__comments');
        if (!commentsSection) {
            this.log('Comments section not found for comment');
            return null;
        }

        const postId = commentsSection.id.replace('comments-', '');
        this.log(`Found post ID from comment: ${postId}`);
        return postId;
    }

    /**
     * Configura las acciones de comentarios para un post
     * @param {string} postId - ID del post
     */
    setupCommentActions(postId) {
        const commentInput = document.getElementById(`comment-input-${postId}`);
        const submitBtn = commentInput?.nextElementSibling;

        if (commentInput && submitBtn) {
            // Submit con Ctrl+Enter
            commentInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.addComment(postId);
                }
            });

            // Auto-resize
            commentInput.addEventListener('input', () => {
                this.autoResizeTextarea(commentInput);
            });
        }
    }

    /**
     * Ajusta automáticamente la altura del textarea
     * @param {HTMLTextAreaElement} textarea - Elemento textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    /**
     * Muestra un mensaje de error en los comentarios
     * @param {string} postId - ID del post
     * @param {string} message - Mensaje de error
     */
    showCommentError(postId, message) {
        const commentInput = document.getElementById(`comment-input-${postId}`);
        if (!commentInput) return;

        // Remover errores anteriores
        const existingError = commentInput.parentNode.querySelector('.comment-error');
        if (existingError) {
            existingError.remove();
        }

        // Crear elemento de error
        const errorSection = document.createElement('section');
        errorSection.className = 'comment-error';
        errorSection.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>
            ${message}
        `;
        errorSection.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            padding: 8px 12px;
            background: #f8d7da;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            display: flex;
            align-items: center;
        `;

        commentInput.parentNode.insertBefore(errorSection, commentInput.nextSibling);

        // Scroll al error
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (errorSection.parentNode) {
                errorSection.parentNode.removeChild(errorSection);
            }
        }, 5000);
    }

    /**
     * Muestra un mensaje de éxito en los comentarios
     * @param {string} postId - ID del post
     * @param {string} message - Mensaje de éxito
     */
    showCommentSuccess(postId, message) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        // Remover mensajes anteriores
        const existingSuccess = commentsSection.querySelector('.comment-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        const successSection = document.createElement('section');
        successSection.className = 'comment-success';
        successSection.textContent = message;
        successSection.style.cssText = `
            color: #28a745;
            font-size: 12px;
            margin-bottom: 8px;
            padding: 8px 12px;
            background: #d4edda;
            border-radius: 4px;
            text-align: center;
        `;

        const commentsContainer = commentsSection.querySelector('.comments-container');
        if (commentsContainer) {
            commentsContainer.insertBefore(successSection, commentsContainer.firstChild);
        }

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (successSection.parentNode) {
                successSection.parentNode.removeChild(successSection);
            }
        }, 5000);
    }

    /**
     * Muestra un mensaje toast al usuario
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje (success, error)
     */
    showMessage(message, type = 'success') {
        // Remover toasts anteriores
        const existingToasts = document.querySelectorAll('.comment-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('section');
        toast.className = 'comment-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} unsafe - Texto sin escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// =====================================================================
// SECCIÓN 12: CLASE PRINCIPAL DEVCOMMUNITY - SISTEMA DE POSTS CON FILTROS
// =====================================================================

/**
 * Clase principal que maneja toda la funcionalidad de la comunidad DEV
 * Incluye posts, autenticación, búsqueda y más
 */
class DevCommunity {
    constructor() {
        this.currentUser = null; // Usuario actualmente autenticado
        this.posts = []; // Array de posts cargados
        this.currentPage = 1; // Paginación actual
        this.isLoading = false; // Estado de carga
        this.hasMorePosts = true; // Si hay más posts para cargar
        this.commentSystem = new CommentSystem(this); // Sistema de comentarios
        this.postDeletionSystem = new PostDeletionSystem(this); // Sistema de eliminación de posts
        this.postEditSystem = new PostEditSystem(this); // Sistema de edición de posts
        this.init(); // Inicialización
    }

    /**
     * Verifica y sincroniza el estado de autenticación
     * @returns {boolean} Estado de autenticación
     */
    checkAndSyncAuth() {
        console.log('🔐 Verificando y sincronizando autenticación...');

        // Sincronizar authManager
        if (authManager) {
            authManager.syncAuthState();
        }

        // Si hay usuario actual pero authManager no está autenticado, actualizar
        if (this.currentUser && !authManager.isAuthenticated) {
            console.log('🔄 Actualizando authManager con usuario de devCommunity');
            authManager.isAuthenticated = true;
        }

        return this.currentUser || authManager.isAuthenticated;
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        await this.checkAuthentication();
        this.bindEvents();
        this.loadPosts();
        this.setupMinibar();
        this.loadPopularTags();
    }

    /**
     * Verifica el estado de autenticación del usuario
     */
    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            if (!response.ok) throw new Error('Auth failed');
            const data = await response.json();

            if (data.user) {
                this.currentUser = data.user;
                this.showUserNavigation();
            } else {
                this.showAuthNavigation();
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.showAuthNavigation();
        }
    }

    /**
     * Muestra la navegación para usuarios autenticados
     */
    showUserNavigation() {
        const authActions = document.getElementById('authActions');
        const userNav = document.getElementById('userNav');
        const userAvatar = document.getElementById('userAvatar');
        const dropdownUsername = document.getElementById('dropdownUsername');

        if (authActions) authActions.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        if (userAvatar && this.currentUser.profilePicture) {
            userAvatar.src = this.currentUser.profilePicture;
        }
        if (dropdownUsername && this.currentUser.username) {
            dropdownUsername.textContent = this.currentUser.username;
        }

        this.setupUserMenu();
    }

    /**
     * Muestra la navegación para usuarios no autenticados
     */
    showAuthNavigation() {
        const authActions = document.getElementById('authActions');
        const userNav = document.getElementById('userNav');

        if (authActions) authActions.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }

    /**
     * Configura el menú de usuario
     */
    setupUserMenu() {
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');

        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (userDropdown) {
                    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
                }
            });
        }

        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.style.display = 'none';
        });

        if (userDropdown) {
            userDropdown.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    /**
     * Vincula los event listeners de la aplicación
     */
    bindEvents() {
        // Tabs del feed
        const tabs = document.querySelectorAll('.tab');
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchFeedView(e.target.dataset.view);
                });
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentPage = 1;
                this.hasMorePosts = true;
                this.loadPosts();
            });
        }

        // Create post button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = '/PERFIL/createPost.html';
                } else {
                    window.location.href = '/Login.html';
                }
            });
        }

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const leftbar = document.getElementById('leftbar');
        if (menuToggle && leftbar) {
            menuToggle.addEventListener('click', () => {
                leftbar.classList.toggle('leftbar--mobile-open');
            });
        }

        // Infinite scroll
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.doSearch(searchInput.value.trim());
                }, 300);
            });

            // También buscar al presionar Enter
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    this.doSearch(searchInput.value.trim());
                }
            });
        }
    }

    /**
     * Carga los posts desde la API con los filtros correctos
     */
    async loadPosts() {
        if (this.isLoading || !this.hasMorePosts) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            const view = document.querySelector('.tab--active')?.dataset.view || 'latest';
            const sort = document.getElementById('sortSelect')?.value || 'new';

            // Construir URL con parámetros de filtro
            let url = `/api/posts?page=${this.currentPage}&sort=${sort}`;

            // Aplicar filtros según la vista seleccionada
            if (view === 'top') {
                // Posts con más reacciones totales
                url += '&sortBy=reactions&order=desc';
            } else if (view === 'trending') {
                // Posts con más corazones (likes específicos)
                url += '&sortBy=hearts&order=desc';
            } else {
                // Latest - posts más recientes
                url += '&sortBy=date&order=desc';
            }

            console.log(`Loading posts with URL: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                // Si no hay endpoint de posts, usar datos de ejemplo
                if (response.status === 404) {
                    console.log('API endpoint not found, using mock data');
                    this.handleMockPosts(view);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.handlePostsResponse(data, view);

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Error loading posts. Please try again.');
            // En caso de error, usar datos de ejemplo
            const view = document.querySelector('.tab--active')?.dataset.view || 'latest';
            this.handleMockPosts(view);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * Maneja la respuesta de la API de posts
     * @param {Object} data - Datos de respuesta
     * @param {string} view - Vista activa
     */
    handlePostsResponse(data, view) {
        let posts = [];

        // Extraer posts de diferentes formatos de respuesta
        if (data.posts && data.posts.length > 0) {
            posts = data.posts;
        } else if (Array.isArray(data)) {
            posts = data;
        }

        // Aplicar filtros locales si es necesario
        if (posts.length > 0) {
            posts = this.applyLocalFilters(posts, view);
        }

        if (posts.length > 0) {
            // Actualizar posts según paginación
            if (this.currentPage === 1) {
                this.posts = posts;
            } else {
                this.posts = [...this.posts, ...posts];
            }

            this.renderPosts();
            this.currentPage++;

            // Verificar si hay más páginas
            if (this.currentPage > (data.totalPages || 1)) {
                this.hasMorePosts = false;
            }
        } else {
            // No hay posts
            this.posts = [];
            this.renderPosts();
            this.hasMorePosts = false;
        }
    }

    /**
     * Aplica filtros locales a los posts (fallback si el backend no lo hace)
     * @param {Array} posts - Array de posts
     * @param {string} view - Vista activa
     * @returns {Array} Posts filtrados
     */
    applyLocalFilters(posts, view) {
        console.log(`Applying local filter: ${view} to ${posts.length} posts`);

        switch (view) {
            case 'top':
                // Ordenar por total de reacciones
                return posts.sort((a, b) => {
                    const aReactions = this.calculateTotalReactions(a);
                    const bReactions = this.calculateTotalReactions(b);
                    return bReactions - aReactions;
                });

            case 'trending':
                // Ordenar por cantidad de corazones
                return posts.sort((a, b) => {
                    const aHearts = a.reactionCounts?.heart || 0;
                    const bHearts = b.reactionCounts?.heart || 0;
                    return bHearts - aHearts;
                });

            case 'latest':
            default:
                // Ordenar por fecha (más recientes primero)
                return posts.sort((a, b) => {
                    const aDate = new Date(a.createdAt || a.date || 0);
                    const bDate = new Date(b.createdAt || b.date || 0);
                    return bDate - aDate;
                });
        }
    }

    /**
     * Calcula el total de reacciones de un post
     * @param {Object} post - Datos del post
     * @returns {number} Total de reacciones
     */
    calculateTotalReactions(post) {
        if (!post.reactionCounts) return 0;

        return Object.values(post.reactionCounts).reduce((total, count) => {
            return total + (parseInt(count) || 0);
        }, 0);
    }

    /**
     * Maneja datos de ejemplo cuando la API no está disponible
     * @param {string} view - Vista activa
     */
    handleMockPosts(view) {
        // Generar posts de ejemplo con diferentes cantidades de reacciones
        const mockPosts = this.generateMockPosts();

        // Aplicar filtros a los posts de ejemplo
        const filteredPosts = this.applyLocalFilters(mockPosts, view);

        if (this.currentPage === 1) {
            this.posts = filteredPosts;
        } else {
            // Para scroll infinito, agregar más posts
            const morePosts = this.generateMockPosts(10, this.posts.length);
            this.posts = [...this.posts, ...this.applyLocalFilters(morePosts, view)];
        }

        this.renderPosts();
        this.currentPage++;

        // Limitar a 3 páginas para datos de ejemplo
        if (this.currentPage > 3) {
            this.hasMorePosts = false;
        }
    }

    /**
     * Genera posts de ejemplo con diferentes cantidades de reacciones
     * @param {number} count - Cantidad de posts a generar
     * @param {number} offset - Offset para IDs únicos
     * @returns {Array} Array de posts de ejemplo
     */
    generateMockPosts(count = 10, offset = 0) {
        const mockPosts = [];
        const reactionTypes = ['like', 'unicorn', 'exploding_head', 'fire', 'heart', 'rocket'];

        for (let i = 0; i < count; i++) {
            const postId = offset + i + 1;

            // Generar counts de reacciones aleatorias
            const reactionCounts = {};
            reactionTypes.forEach(type => {
                // Los posts pares tienen más corazones para trending
                // Los posts impares tienen más reacciones totales para top
                if (type === 'heart') {
                    reactionCounts[type] = postId % 2 === 0 ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 10);
                } else {
                    reactionCounts[type] = postId % 2 === 1 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 15);
                }
            });

            mockPosts.push({
                _id: `mock-post-${postId}`,
                title: `Mock Post ${postId} - ${['JavaScript', 'React', 'Node.js', 'Python', 'Web Dev'][i % 5]}`,
                content: `This is a mock post content for testing the ${view} filter. This post has various reaction counts for demonstration purposes.`,
                author: {
                    username: `user${postId}`,
                    profilePicture: '/IMAGENES/default-avatar.png'
                },
                reactionCounts: reactionCounts,
                commentsCount: Math.floor(Math.random() * 20),
                readingTime: Math.floor(Math.random() * 10) + 1,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
                tags: ['javascript', 'webdev', 'react', 'nodejs'].slice(0, Math.floor(Math.random() * 3) + 1)
            });
        }

        return mockPosts;
    }

    /**
     * Renderiza los posts en el contenedor
     */
    renderPosts() {
        const articlesContainer = document.getElementById('articles');

        if (!articlesContainer) return;

        if (this.posts.length === 0) {
            articlesContainer.innerHTML = `
                <section class="no-posts">
                    <i class="fas fa-newspaper" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to create a post!</p>
                    ${this.currentUser ? '<button class="btn btn--primary" onclick="window.location.href=\'/PERFIL/createPost.html\'">Create Post</button>' : ''}
                </section>
            `;
            return;
        }

        // Renderizar todos los posts
        articlesContainer.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');

        // Asegurar que las tarjetas se vean bien
        const articleCards = articlesContainer.querySelectorAll('.article-card');
        articleCards.forEach(card => {
            card.style.opacity = '1';
            card.style.background = 'white';
        });
    }

    /**
     * Crea el HTML para un post individual IDÉNTICO a Dev.to
     * @param {Object} post - Datos del post
     * @returns {string} HTML del post
     */
    createPostHTML(post) {
        const readingTime = post.readingTime || Math.ceil((post.content?.length || 0) / 200) || 1;
        const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Recently';

        const author = post.author || {};
        const profilePicture = author.profilePicture || '/IMAGENES/default-avatar.png';
        const username = author.username || 'Unknown User';

        const postId = post._id || post.id;

        // Obtener HTML de los botones de acción
        const deleteButtonHTML = this.postDeletionSystem.createDeleteButtonHTML(post);
        const editButtonHTML = this.postEditSystem.createEditButtonHTML(post);

        // Determinar la clase de tamaño de la imagen
        const coverSizeClass = post.coverSize ? ` article-card__cover--${post.coverSize}` : '';

        return `
        <article class="article-card" data-post-id="${postId}" style="opacity: 1;">
            <section class="article-card__inner">
                ${post.coverImage ? `
                    <figure class="article-card__cover${coverSizeClass}">
                        <img src="${post.coverImage}" alt="Cover image for ${post.title}" onerror="this.style.display='none'">
                    </figure>
                ` : ''}

                <section class="article-card__content">
                    <header class="article-card__header">
                        <img src="${profilePicture}" alt="${username}" class="article-card__avatar" onerror="this.src='/IMAGENES/default-avatar.png'">
                        <section class="article-card__user-info">
                            <a href="#" class="article-card__username">${username}</a>
                            <time class="article-card__date">${date}</time>
                        </section>
                        <section class="article-card__actions">
                            ${editButtonHTML}
                            ${deleteButtonHTML}
                            ${this.currentUser && !deleteButtonHTML ? `
                                <button class="article-card__bookmark ${post.hasFavorited ? 'article-card__bookmark--active' : ''}" 
                                        onclick="devCommunity.toggleFavorite('${postId}')">
                                    <i class="fas fa-bookmark"></i>
                                </button>
                            ` : ''}
                        </section>
                    </header>

                    <h2 class="article-card__title">
                        <a href="#" onclick="devCommunity.viewPost('${postId}'); return false;">${post.title || 'Untitled Post'}</a>
                    </h2>
                    
                    ${post.tags && post.tags.length > 0 ? `
                        <nav class="article-card__tags">
                            ${post.tags.map(tag => `
                                <a href="#" class="tag" onclick="devCommunity.filterByTag('${tag}'); return false;">#${tag}</a>
                            `).join('')}
                        </nav>
                    ` : ''}

                    <footer class="article-card__footer">
                        <nav class="article-card__reactions">
                            ${this.createReactionsHTML(post)}
                        </nav>
                        
                        <section class="article-card__meta">
                            <span class="article-card__reading-time">${readingTime} min read</span>
                            <button class="article-card__comments-btn" onclick="devCommunity.commentSystem.toggleComments('${postId}')">
                                <i class="fas fa-comment"></i>
                                <span>${post.commentsCount || 0}</span>
                            </button>
                        </section>
                    </footer>
                </section>

                <!-- SECCIÓN DE COMENTARIOS -->
                <section class="article-card__comments" id="comments-${postId}" style="display: none;">
                    <section class="comments-container" id="comments-container-${postId}">
                        <!-- Los comentarios se cargarán aquí -->
                    </section>
                    ${this.currentUser ? `
                        <section class="comment-form">
                            <textarea class="comment-input" id="comment-input-${postId}" 
                                      placeholder="Add to the discussion... (Ctrl+Enter to submit)"></textarea>
                            <button class="btn btn--primary btn--small" onclick="devCommunity.commentSystem.addComment('${postId}')">
                                Submit Comment
                            </button>
                        </section>
                    ` : `
                        <section class="login-prompt">
                            <a href="/Login.html">Log in</a> to leave a comment
                        </section>
                    `}
                </section>
            </section>
        </article>
    `;
    }

    /**
     * Crea el HTML para las reacciones de un post
     * @param {Object} post - Datos del post
     * @returns {string} HTML de las reacciones
     */
    createReactionsHTML(post) {
        const reactions = [
            { type: 'like', icon: '👍', label: 'Like' },
            { type: 'unicorn', icon: '🦄', label: 'Unicorn' },
            { type: 'exploding_head', icon: '🤯', label: 'Exploding Head' },
            { type: 'fire', icon: '🔥', label: 'Fire' },
            { type: 'heart', icon: '❤️', label: 'Heart' },
            { type: 'rocket', icon: '🚀', label: 'Rocket' }
        ];

        // Calcular total de reacciones para este post
        const totalReactions = this.calculateTotalReactions(post);

        return `
            <section class="reactions-section">
                <nav class="article-card__reactions">
                    ${reactions.map(reaction => {
            const count = post.reactionCounts?.[reaction.type] || 0;
            const isActive = post.hasReacted && post.userReaction === reaction.type;

            return `
                            <button class="reaction-btn ${isActive ? 'reaction-btn--active' : ''}" 
                                    onclick="devCommunity.addReaction('${post._id || post.id}', '${reaction.type}')"
                                    title="${reaction.label}: ${count}">
                                <span class="reaction-emoji">${reaction.icon}</span>
                                <span class="reaction-count">${count}</span>
                            </button>
                        `;
        }).join('')}
                </nav>
            </section>
        `;
    }

    /**
     * Agrega una reacción a un post
     * @param {string} postId - ID del post
     * @param {string} reactionType - Tipo de reacción
     */
    async addReaction(postId, reactionType) {
        if (!this.currentUser) {
            window.location.href = '/Login.html';
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reactionType })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updatePostReactions(postId, data);
                }
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    /**
     * Actualiza las reacciones de un post en la interfaz
     * @param {string} postId - ID del post
     * @param {Object} reactionData - Datos actualizados de reacciones
     */
    updatePostReactions(postId, reactionData) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const reactionsContainer = postElement.querySelector('.article-card__reactions');
        if (reactionsContainer) {
            const postIndex = this.posts.findIndex(p => (p._id || p.id) === postId);
            if (postIndex !== -1) {
                this.posts[postIndex].reactionCounts = reactionData.reactionCounts;
                this.posts[postIndex].hasReacted = reactionData.hasReacted;
                this.posts[postIndex].userReaction = reactionData.userReaction;

                reactionsContainer.innerHTML = this.createReactionsHTML(this.posts[postIndex]);
            }
        }
    }

    /**
     * Alterna el estado de favorito de un post
     * @param {string} postId - ID del post
     */
    async toggleFavorite(postId) {
        if (!this.currentUser) {
            window.location.href = '/Login.html';
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/favorite`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updatePostFavorite(postId, data);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    /**
     * Actualiza el estado de favorito de un post en la interfaz
     * @param {string} postId - ID del post
     * @param {Object} favoriteData - Datos actualizados de favoritos
     */
    updatePostFavorite(postId, favoriteData) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const bookmarkBtn = postElement.querySelector('.article-card__bookmark');
        if (bookmarkBtn) {
            if (favoriteData.addedToFavorites) {
                bookmarkBtn.classList.add('article-card__bookmark--active');
            } else {
                bookmarkBtn.classList.remove('article-card__bookmark--active');
            }

            const postIndex = this.posts.findIndex(p => (p._id || p.id) === postId);
            if (postIndex !== -1) {
                this.posts[postIndex].hasFavorited = favoriteData.addedToFavorites;
                this.posts[postIndex].favoritesCount = favoriteData.favoritesCount;
            }
        }
    }

    /**
     * Maneja la visualización de un post (abre comentarios)
     * @param {string} postId - ID del post
     */
    viewPost(postId) {
        // Al hacer clic en el título, abrir los comentarios
        this.commentSystem.toggleComments(postId);
    }

    /**
     * Cambia la vista del feed (latest, top, etc.)
     * @param {string} view - Tipo de vista
     */
    switchFeedView(view) {
        console.log(`Switching to view: ${view}`);

        // Actualizar tabs activos
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.toggle('tab--active', tab.dataset.view === view);
        });

        // Reset and reload posts
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.posts = [];

        // Mostrar indicador de filtro activo
        this.showActiveFilter(view);

        this.loadPosts();
    }

    /**
     * Muestra el filtro activo en la interfaz
     * @param {string} view - Vista activa
     */
    showActiveFilter(view) {
        // Remover indicadores anteriores
        const existingIndicators = document.querySelectorAll('.active-filter-indicator');
        existingIndicators.forEach(indicator => indicator.remove());

        const feedControls = document.querySelector('.feed-controls');
        if (feedControls) {
            const indicator = document.createElement('div');
            indicator.className = 'active-filter-indicator';
            feedControls.appendChild(indicator);
        }
    }

    /**
     * Realiza una búsqueda de posts
     * @param {string} query - Término de búsqueda
     */
    doSearch(query) {
        if (!query) {
            // Si la búsqueda está vacía, recargar posts normales
            this.currentPage = 1;
            this.hasMorePosts = true;
            this.loadPosts();
            return;
        }

        // Filtrar posts localmente
        const filteredPosts = this.posts.filter(post => {
            const searchText = (post.title + ' ' + (post.content || '') + ' ' + (post.author?.username || '')).toLowerCase();
            const inTags = post.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
            return searchText.includes(query.toLowerCase()) || inTags;
        });

        this.renderSearchResults(filteredPosts);
    }

    /**
     * Renderiza los resultados de búsqueda
     * @param {Array} posts - Posts filtrados
     */
    renderSearchResults(posts) {
        const articlesContainer = document.getElementById('articles');
        if (!articlesContainer) return;

        if (posts.length === 0) {
            articlesContainer.innerHTML = `
                <section class="no-posts">
                    <i class="fas fa-search" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                    <h3>No posts found</h3>
                    <p>Try different search terms</p>
                </section>
            `;
            return;
        }

        articlesContainer.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
    }

    /**
     * Maneja el scroll infinito
     */
    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        // Cargar más posts cuando esté cerca del final
        if (scrollTop + clientHeight >= scrollHeight - 500 && !this.isLoading && this.hasMorePosts) {
            this.loadPosts();
        }
    }

    /**
     * Muestra/oculta el indicador de carga
     * @param {boolean} show - Mostrar u ocultar
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }

        const articlesContainer = document.getElementById('articles');
        if (articlesContainer) {
            articlesContainer.style.opacity = show ? '0.5' : '1';
        }
    }

    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        console.error('Error:', message);
    }

    /**
     * Configura la funcionalidad de la minibar
     */
    setupMinibar() {
        const minibarItems = document.querySelectorAll('.minibar__item');

        minibarItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const preview = item.querySelector('.minibar__preview');
                if (preview) {
                    preview.style.display = 'block';
                }
            });

            item.addEventListener('mouseleave', () => {
                const preview = item.querySelector('.minibar__preview');
                if (preview) {
                    preview.style.display = 'none';
                }
            });
        });
    }

    /**
     * Carga los tags populares
     */
    async loadPopularTags() {
        // Ya se maneja en renderTags()
    }
}

// =====================================================================
// SECCIÓN 13: FUNCIONALIDAD DE LA MINIBAR MEJORADA
// =====================================================================

/**
 * Funcionalidad de la minibar con previews interactivos
 * Maneja los previews que aparecen al pasar el mouse sobre los íconos
 */
document.addEventListener('DOMContentLoaded', function () {
    const minibarItems = document.querySelectorAll('.minibar__item');
    let activePreview = null; // Preview actualmente activo

    /**
     * Calcula la posición óptima del preview evitando que se salga de la pantalla
     * @param {HTMLElement} link - Elemento del enlace
     * @param {HTMLElement} preview - Elemento del preview
     * @returns {number} Posición top calculada
     */
    function calculatePreviewPosition(link, preview) {
        const linkRect = link.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Posición inicial: misma posición vertical que el enlace
        let topPosition = linkRect.top;
        const previewHeight = 320; // Altura estimada del preview

        // Ajustar si el preview se sale por la parte inferior de la pantalla
        if (topPosition + previewHeight > viewportHeight - 20) {
            topPosition = viewportHeight - previewHeight - 20;
        }

        // Ajustar si el preview se sale por la parte superior de la pantalla
        if (topPosition < 20) {
            topPosition = 20;
        }

        return topPosition;
    }

    /**
     * Muestra el preview de un ítem específico
     * @param {HTMLElement} item - Elemento del ítem de la minibar
     */
    function showPreview(item) {
        const preview = item.querySelector('.minibar__preview');
        const link = item.querySelector('.minibar__link');

        if (preview && link) {
            // Ocultar preview anterior si existe
            if (activePreview && activePreview !== preview) {
                activePreview.style.display = 'none';
            }

            // Calcular y aplicar posición
            const topPosition = calculatePreviewPosition(link, preview);
            preview.style.top = topPosition + 'px';
            preview.style.display = 'block';

            // Actualizar referencia
            activePreview = preview;
        }
    }

    /**
     * Oculta un preview específico
     * @param {HTMLElement} preview - Elemento del preview a ocultar
     */
    function hidePreview(preview) {
        if (preview) {
            preview.style.display = 'none';
        }
    }

    // Configurar event listeners para cada ítem
    minibarItems.forEach(item => {
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');

        if (link && preview) {
            // Mostrar preview al entrar
            item.addEventListener('mouseenter', function () {
                showPreview(item);
            });

            // Ocultar preview al salir (con delay)
            item.addEventListener('mouseleave', function (e) {
                setTimeout(() => {
                    if (!item.matches(':hover') && !preview.matches(':hover')) {
                        hidePreview(preview);
                    }
                }, 100);
            });

            // Mantener preview visible cuando el mouse está sobre él
            preview.addEventListener('mouseenter', function () {
                preview.style.display = 'block';
            });

            // Ocultar preview cuando el mouse sale del preview
            preview.addEventListener('mouseleave', function () {
                hidePreview(preview);
            });
        }
    });

    // Ocultar previews al hacer scroll
    window.addEventListener('scroll', function () {
        if (activePreview) {
            hidePreview(activePreview);
        }
    });
});

// =====================================================================
// SECCIÓN 14: SISTEMA DE ELIMINACIÓN DE POSTS CON BACKEND
// =====================================================================

/**
 * Clase que maneja la eliminación de posts
 * Incluye confirmación, comunicación con backend y actualización de UI
 */
class PostDeletionSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity;
        this.debug = true;
    }

    /**
     * Logging para debugging del sistema de eliminación
     * @param {string} message - Mensaje a loguear
     * @param {*} data - Datos adicionales
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[PostDeletionSystem] ${message}`, data);
            } else {
                console.log(`[PostDeletionSystem] ${message}`);
            }
        }
    }

    /**
     * Verifica si el usuario actual es el autor del post
     * @param {Object} post - Datos del post
     * @returns {boolean} True si el usuario es el autor
     */
    isUserPostAuthor(post) {
        if (!this.devCommunity.currentUser || !post.author) {
            return false;
        }

        const currentUserId = this.devCommunity.currentUser.id || this.devCommunity.currentUser._id;
        const authorId = post.author._id || post.author.id;

        return currentUserId === authorId;
    }

    /**
     * Crea el HTML del botón de eliminar si el usuario es el autor
     * @param {Object} post - Datos del post
     * @returns {string} HTML del botón de eliminar
     */
    createDeleteButtonHTML(post) {
        if (!this.isUserPostAuthor(post)) {
            return '';
        }

        const postId = post._id || post.id;
        return `
            <button class="article-card__delete-btn" onclick="devCommunity.postDeletionSystem.showDeleteConfirmation('${postId}')" title="Delete Post">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    /**
     * Muestra el modal de confirmación para eliminar un post
     * @param {string} postId - ID del post a eliminar
     */
    showDeleteConfirmation(postId) {
        this.log(`Showing delete confirmation for post: ${postId}`);

        // Crear modal de confirmación
        const modalHTML = `
            <section id="deletePostModal" class="modal" style="display: flex;">
                <section class="modal__overlay"></section>
                <section class="modal__content">
                    <section class="modal__center">
                        <section class="modal__icon" style="font-size: 48px; color: #dc3545; margin-bottom: 16px;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </section>
                        <p class="modal__text" style="text-align: center; margin-bottom: 24px;">
                            Are you sure you want to delete this post?<br>
                            <small style="color: #666;">This action cannot be undone.</small>
                        </p>
                        <section class="modal__actions">
                            <button type="button" class="btn btn--outline" id="deletePostCancel">
                                Cancel
                            </button>
                            <button type="button" class="btn btn--danger" id="deletePostConfirm">
                                Yes, Delete Post
                            </button>
                        </section>
                    </section>
                </section>
            </section>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('deletePostModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos
        this.setupDeleteModalEvents(postId);

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }

    /**
     * Configura los eventos del modal de eliminación
     * @param {string} postId - ID del post a eliminar
     */
    setupDeleteModalEvents(postId) {
        const modal = document.getElementById('deletePostModal');
        const confirmBtn = document.getElementById('deletePostConfirm');
        const cancelBtn = document.getElementById('deletePostCancel');
        const overlay = modal.querySelector('.modal__overlay');

        // Confirmar eliminación
        confirmBtn.addEventListener('click', () => {
            this.deletePost(postId);
            this.closeDeleteModal();
        });

        // Cancelar eliminación
        cancelBtn.addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // Cerrar modal al hacer clic en el overlay
        overlay.addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // Cerrar modal con tecla Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Cierra el modal de eliminación
     */
    closeDeleteModal() {
        const modal = document.getElementById('deletePostModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }

    /**
     * Elimina un post del servidor
     * @param {string} postId - ID del post a eliminar
     */
    async deletePost(postId) {
        this.log(`Deleting post: ${postId}`);

        try {
            // Mostrar indicador de carga
            this.showDeletionLoading(postId, true);

            // Usar makeAuthenticatedRequest para manejar autenticación
            const response = await makeAuthenticatedRequest(`/api/posts/${postId}`, {
                method: 'DELETE'
            });

            this.log(`Delete response status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                this.log('Delete response data:', data);

                if (data.success) {
                    await this.handlePostDeletionSuccess(postId);
                } else {
                    throw new Error(data.message || 'Failed to delete post');
                }
            } else if (response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('You are not authorized to delete this post.');
            } else if (response.status === 404) {
                throw new Error('Post not found. It may have been already deleted.');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.handlePostDeletionError(postId, error);
        } finally {
            this.showDeletionLoading(postId, false);
        }
    }

    /**
     * Maneja el éxito en la eliminación de un post
     * @param {string} postId - ID del post eliminado
     */
    async handlePostDeletionSuccess(postId) {
        this.log(`Post deletion successful: ${postId}`);

        // Remover el post del array local
        const postIndex = this.devCommunity.posts.findIndex(post => {
            const id = post._id || post.id;
            return id === postId;
        });

        if (postIndex !== -1) {
            this.devCommunity.posts.splice(postIndex, 1);
            this.devCommunity.renderPosts();
        }

        this.showMessage('Post deleted successfully!', 'success');

        // Recargar posts desde el servidor para consistencia
        await this.refreshPostsFromServer();
    }

    /**
     * Recarga los posts desde el servidor para mantener consistencia
     */
    async refreshPostsFromServer() {
        try {
            this.log('Refreshing posts from server...');

            // Resetear estado de paginación
            this.devCommunity.currentPage = 1;
            this.devCommunity.hasMorePosts = true;
            this.devCommunity.posts = [];

            // Recargar posts
            await this.devCommunity.loadPosts();

            this.log('Posts refreshed successfully');
        } catch (error) {
            console.error('Error refreshing posts:', error);
            // No mostrar error al usuario, ya que la eliminación fue exitosa
        }
    }

    /**
     * Maneja errores en la eliminación de posts
     * @param {string} postId - ID del post
     * @param {Error} error - Error ocurrido
     */
    handlePostDeletionError(postId, error) {
        this.log(`Post deletion error: ${postId}`, error);

        let errorMessage = 'Error deleting post. Please try again.';

        if (error.message.includes('Authentication required')) {
            errorMessage = 'You need to be logged in to delete posts.';
            // Redirigir al login
            setTimeout(() => {
                window.location.href = '/Login.html';
            }, 2000);
        } else if (error.message.includes('not authorized')) {
            errorMessage = 'You can only delete your own posts.';
        } else if (error.message.includes('not found')) {
            errorMessage = 'Post not found. It may have been already deleted.';
            // Forzar recarga de posts
            this.refreshPostsFromServer();
        } else {
            errorMessage = error.message || 'Error deleting post. Please try again.';
        }

        this.showMessage(errorMessage, 'error');
    }

    /**
     * Muestra/oculta el indicador de carga durante la eliminación
     * @param {string} postId - ID del post
     * @param {boolean} show - Mostrar u ocultar
     */
    showDeletionLoading(postId, show) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) return;

        const deleteBtn = postElement.querySelector('.article-card__delete-btn');
        if (deleteBtn) {
            if (show) {
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.6';
            } else {
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
            }
        }
    }

    /**
     * Muestra un mensaje toast al usuario
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje (success, error, warning)
     */
    showMessage(message, type = 'success') {
        // Remover toasts anteriores
        const existingToasts = document.querySelectorAll('.post-deletion-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'post-deletion-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${this.getToastColor(type)};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animación de entrada
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.style.transition = 'transform 0.3s ease';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remover con animación de salida
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Obtiene el color del toast según el tipo
     * @param {string} type - Tipo de mensaje
     * @returns {string} Color en hexadecimal
     */
    getToastColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
}

// =====================================================================
// SECCIÓN 15: SISTEMA DE EDICIÓN DE POSTS CON DEBUGGING
// =====================================================================

/**
 * Clase que maneja la edición de posts
 * Incluye formulario modal, validaciones y comunicación con backend
 */
class PostEditSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity;
        this.debug = true;
        this.currentEditingPost = null; // Post actualmente en edición
    }

    /**
     * Logging para debugging del sistema de edición
     * @param {string} message - Mensaje a loguear
     * @param {*} data - Datos adicionales
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[PostEditSystem] ${message}`, data);
            } else {
                console.log(`[PostEditSystem] ${message}`);
            }
        }
    }

    /**
     * Verifica si el usuario actual es el autor del post
     * @param {Object} post - Datos del post
     * @returns {boolean} True si el usuario es el autor
     */
    isUserPostAuthor(post) {
        if (!this.devCommunity.currentUser || !post.author) {
            return false;
        }

        const currentUserId = this.devCommunity.currentUser.id || this.devCommunity.currentUser._id;
        const authorId = post.author._id || post.author.id;

        return currentUserId === authorId;
    }

    /**
     * Crea el HTML del botón de editar si el usuario es el autor
     * @param {Object} post - Datos del post
     * @returns {string} HTML del botón de editar
     */
    createEditButtonHTML(post) {
        if (!this.isUserPostAuthor(post)) {
            return '';
        }

        // Forzar sincronización de autenticación
        if (authManager) {
            authManager.syncAuthState();
        }

        const postId = post._id || post.id;
        return `
        <button class="article-card__edit-btn" onclick="devCommunity.postEditSystem.showEditForm('${postId}')" title="Edit Post">
            <i class="fas fa-edit"></i>
        </button>
    `;
    }

    /**
     * Muestra el formulario de edición para un post
     * @param {string} postId - ID del post a editar
     */
    async showEditForm(postId) {
        try {
            this.log(`🔄 Iniciando showEditForm para post: ${postId}`);

            // VERIFICACIÓN MEJORADA DE AUTENTICACIÓN
            console.log('🔐 Estado completo de autenticación:', {
                authManager: {
                    isAuthenticated: authManager.isAuthenticated,
                    token: authManager.token ? 'PRESENTE' : 'AUSENTE',
                    tokenLength: authManager.token ? authManager.token.length : 0
                },
                devCommunity: {
                    currentUser: this.devCommunity.currentUser ? 'PRESENTE' : 'AUSENTE',
                    currentUserData: this.devCommunity.currentUser
                },
                localStorage: {
                    jwtToken: localStorage.getItem('jwtToken') ? 'PRESENTE' : 'AUSENTE'
                }
            });

            // Verificar autenticación de múltiples maneras
            const isAuthenticated = authManager.isAuthenticated ||
                this.devCommunity.currentUser ||
                localStorage.getItem('jwtToken');

            if (!isAuthenticated) {
                console.error('❌ Usuario no autenticado en todos los métodos');
                this.showMessage('Please log in to edit posts', 'error');
                return;
            }

            // Sincronizar token si es necesario
            if (!authManager.token && localStorage.getItem('jwtToken')) {
                console.log('🔄 Actualizando token en authManager desde localStorage');
                authManager.token = localStorage.getItem('jwtToken');
                authManager.isAuthenticated = true;
            }

            // Mostrar indicador de carga
            this.showEditLoading(true);

            const url = `/api/posts/${postId}/edit`;
            console.log('🌐 Realizando request a:', url);

            // Preparar headers
            const headers = {
                'Content-Type': 'application/json'
            };

            // Agregar token JWT si está disponible
            if (authManager.token) {
                headers['Authorization'] = `Bearer ${authManager.token}`;
                console.log('🔑 Token JWT agregado a headers');
            }

            console.log('📋 Headers de la solicitud:', headers);

            // Cargar datos del post
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            console.log('📡 Response recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;

                // Obtener detalles del error
                try {
                    const errorData = await response.json();
                    console.log('📡 Error data:', errorData);
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    console.log('📡 No se pudo parsear respuesta de error:', parseError);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('📡 Response data completa:', data);

            if (!data.success) {
                throw new Error(data.error || 'Error al cargar el post');
            }

            console.log('✅ Datos del post cargados exitosamente:', {
                id: data.post._id,
                title: data.post.title,
                author: data.post.author.username
            });

            this.currentEditingPost = data.post;
            this.renderEditForm(data.post);

        } catch (error) {
            console.error('❌ Error al cargar post para edición:', error);

            let userMessage = error.message;

            // Mensajes amigables para el usuario
            if (error.message.includes('401')) {
                userMessage = 'Please log in to edit posts';
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (error.message.includes('403')) {
                userMessage = 'You are not authorized to edit this post';
            } else if (error.message.includes('404')) {
                userMessage = 'Post not found';
            } else if (error.message.includes('500')) {
                userMessage = 'Server error. Please try again later.';
            }

            this.showMessage(userMessage, 'error');

        } finally {
            this.showEditLoading(false);
        }
    }

    /**
     * Renderiza el formulario de edición mejorado
     * @param {Object} post - Datos del post
     */
    renderEditForm(post) {
        this.log('🎨 Renderizando formulario de edición mejorado para post:', post);

        // Crear modal de edición
        const modalHTML = `
        <section id="editPostModal" class="modal" style="display: flex;">
            <section class="modal__overlay"></section>
            <section class="modal__content modal__content--large">
                <header class="modal__header">
                    <h2 class="modal__title">
                        <i class="fas fa-edit" style="margin-right: 12px;"></i>
                        Edit Your Post
                    </h2>
                    <button class="modal__close" onclick="devCommunity.postEditSystem.closeEditForm()">
                        <i class="fas fa-times"></i>
                    </button>
                </header>
                
                <section class="modal__body">
                    <form id="editPostForm" class="post-form">
                        <!-- Título -->
                        <section class="form-group">
                            <label for="editPostTitle" class="form-label">
                                <i class="fas fa-heading" style="margin-right: 8px;"></i>
                                Post Title
                            </label>
                            <input type="text" id="editPostTitle" class="form-input" 
                                   value="${this.escapeHtml(post.title)}" 
                                   placeholder="Craft an amazing title that captures attention..." 
                                   maxlength="200" required>
                            <small class="form-help">A great title can make all the difference. Be specific and compelling!</small>
                            <div class="char-counter">${post.title.length}/200 characters</div>
                        </section>

                        <!-- Contenido -->
                        <section class="form-group">
                            <label for="editPostContent" class="form-label">
                                <i class="fas fa-file-alt" style="margin-right: 8px;"></i>
                                Post Content
                            </label>
                            <textarea id="editPostContent" class="form-textarea" 
                                      rows="15" 
                                      placeholder="Share your knowledge, story, or ideas... (Markdown supported)"
                                      required>${this.escapeHtml(post.content)}</textarea>
                            <small class="form-help">You can use Markdown for formatting. Write from the heart!</small>
                        </section>

                        <!-- Tags -->
                        <section class="form-group">
                            <label for="editPostTags" class="form-label">
                                <i class="fas fa-tags" style="margin-right: 8px;"></i>
                                Tags
                            </label>
                            <input type="text" id="editPostTags" class="form-input" 
                                   value="${post.tags ? post.tags.join(', ') : ''}" 
                                   placeholder="javascript, webdev, react, programming">
                            <small class="form-help">Add up to 4 tags separated by commas. Help others discover your post!</small>
                        </section>

                        <!-- Imagen de Portada -->
                        <section class="form-group">
                            <label class="form-label">
                                <i class="fas fa-image" style="margin-right: 8px;"></i>
                                Cover Image
                            </label>
                            
                            ${post.coverImage ? `
                                <section class="current-cover-image">
                                    <img src="${post.coverImage}" alt="Current cover image" 
                                         onerror="this.style.display='none'">
                                    <section class="cover-image-actions">
                                        <button type="button" class="btn btn--outline btn--small" 
                                                onclick="devCommunity.postEditSystem.changeCoverImage()">
                                            <i class="fas fa-sync-alt"></i>
                                            Change Image
                                        </button>
                                        <button type="button" class="btn btn--danger btn--small" 
                                                onclick="devCommunity.postEditSystem.removeCoverImage()">
                                            <i class="fas fa-trash"></i>
                                            Remove Image
                                        </button>
                                    </section>
                                    <input type="hidden" id="editRemoveCoverImage" value="false">
                                </section>
                            ` : `
                                <section class="cover-image-upload">
                                    <input type="file" id="editPostCoverImage" 
                                           accept="image/*" class="file-input">
                                    <small class="form-help">
                                        <i class="fas fa-upload"></i> 
                                        Click to upload a cover image (Optional, max 5MB)
                                    </small>
                                </section>
                            `}
                        </section>

                        <!-- Estado de Publicación -->
                        <section class="form-group">
                            <label class="form-label">
                                <i class="fas fa-globe" style="margin-right: 8px;"></i>
                                Publication Status
                            </label>
                            <section class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="editPostPublished" value="true" 
                                           ${post.published ? 'checked' : ''}>
                                    <span class="radio-custom"></span>
                                    <span>
                                        <i class="fas fa-rocket"></i>
                                        Published
                                    </span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="editPostPublished" value="false" 
                                           ${!post.published ? 'checked' : ''}>
                                    <span class="radio-custom"></span>
                                    <span>
                                        <i class="fas fa-edit"></i>
                                        Draft
                                    </span>
                                </label>
                            </section>
                        </section>

                        <!-- Información del Post -->
                        <section class="post-info">
                            <p><strong>Created:</strong> ${new Date(post.createdAt).toLocaleString()}</p>
                            ${post.updatedAt ? `<p><strong>Last Updated:</strong> ${new Date(post.updatedAt).toLocaleString()}</p>` : ''}
                            ${post.publishedAt ? `<p><strong>Published:</strong> ${new Date(post.publishedAt).toLocaleString()}</p>` : ''}
                        </section>
                    </form>
                </section>

                <footer class="modal__footer">
                    <button type="button" class="btn btn--outline" 
                            onclick="devCommunity.postEditSystem.closeEditForm()">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <section style="display: flex; gap: 12px;">
                        <button type="button" class="btn btn--secondary" 
                                onclick="devCommunity.postEditSystem.saveAsDraft()">
                            <i class="fas fa-save"></i>
                            Save Draft
                        </button>
                        <button type="button" class="btn btn--primary" 
                                onclick="devCommunity.postEditSystem.updatePost()">
                            <i class="fas fa-paper-plane"></i>
                            Update Post
                        </button>
                    </section>
                </footer>
            </section>
        </section>
    `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('editPostModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos
        this.setupEditFormEvents();

        // Prevenir scroll
        document.body.style.overflow = 'hidden';

        console.log('✅ Formulario de edición mejorado renderizado exitosamente');
    }

    /**
     * Configura los eventos del formulario de edición mejorado
     */
    setupEditFormEvents() {
        const modal = document.getElementById('editPostModal');
        const overlay = modal.querySelector('.modal__overlay');
        const closeBtn = modal.querySelector('.modal__close');

        // Cerrar modal al hacer clic en el overlay
        overlay.addEventListener('click', () => {
            this.closeEditForm();
        });

        // Cerrar modal con el botón de cerrar
        closeBtn.addEventListener('click', () => {
            this.closeEditForm();
        });

        // Cerrar modal con tecla Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeEditForm();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Auto-resize del textarea
        const textarea = document.getElementById('editPostContent');
        if (textarea) {
            textarea.addEventListener('input', this.autoResizeTextarea);
            this.autoResizeTextarea({ target: textarea });
        }

        // Contador de caracteres para el título
        const titleInput = document.getElementById('editPostTitle');
        if (titleInput) {
            titleInput.addEventListener('input', this.updateTitleCounter);
            this.updateTitleCounter({ target: titleInput });

            // Efectos de foco
            titleInput.addEventListener('focus', () => {
                titleInput.parentNode.classList.add('focused');
            });
            titleInput.addEventListener('blur', () => {
                titleInput.parentNode.classList.remove('focused');
            });
        }

        // Efectos hover para radio buttons
        const radioLabels = modal.querySelectorAll('.radio-label');
        radioLabels.forEach(label => {
            label.addEventListener('mouseenter', () => {
                label.style.transform = 'translateY(-2px)';
            });
            label.addEventListener('mouseleave', () => {
                if (!label.querySelector('input').checked) {
                    label.style.transform = 'translateY(0)';
                }
            });
        });

        console.log('✅ Eventos del formulario mejorado configurados');
    }

    /**
     * Actualiza el contador de caracteres del título
     * @param {Event} e - Evento de input
     */
    updateTitleCounter(e) {
        const input = e.target;
        const maxLength = 200;
        const currentLength = input.value.length;
        const percentage = (currentLength / maxLength) * 100;

        let counter = input.parentNode.querySelector('.char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            input.parentNode.appendChild(counter);
        }

        counter.textContent = `${currentLength}/${maxLength} characters`;

        // Cambiar colores según el porcentaje usado
        if (percentage >= 90) {
            counter.classList.add('error');
            counter.classList.remove('warning');
        } else if (percentage >= 75) {
            counter.classList.add('warning');
            counter.classList.remove('error');
        } else {
            counter.classList.remove('warning', 'error');
        }
    }

    /**
     * Ajusta automáticamente la altura del textarea
     * @param {Event} e - Evento de input
     */
    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
    }

    /**
     * Maneja el cambio de imagen de portada
     */
    changeCoverImage() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleCoverImageChange(e.target.files[0]);
            }
        });

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    /**
     * Maneja la selección de nueva imagen de portada
     * @param {File} file - Archivo de imagen seleccionado
     */
    handleCoverImageChange(file) {
        if (!file) return;

        // Validaciones
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Image must be less than 5MB', 'error');
            return;
        }

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const currentCoverSection = document.querySelector('.current-cover-image');
            if (currentCoverSection) {
                const img = currentCoverSection.querySelector('img');
                const coverImageActions = currentCoverSection.querySelector('.cover-image-actions');

                img.src = e.target.result;
                img.style.display = 'block';

                // Actualizar input hidden
                const removeCoverInput = document.getElementById('editRemoveCoverImage');
                if (removeCoverInput) {
                    removeCoverInput.value = 'false';
                }

                // Configurar input file
                let fileInput = document.getElementById('editPostCoverImage');
                if (!fileInput) {
                    fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.id = 'editPostCoverImage';
                    fileInput.name = 'coverImage';
                    fileInput.style.display = 'none';
                    currentCoverSection.appendChild(fileInput);
                }

                // Asignar archivo seleccionado
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Remueve la imagen de portada
     */
    removeCoverImage() {
        const currentCoverSection = document.querySelector('.current-cover-image');
        if (currentCoverSection) {
            const img = currentCoverSection.querySelector('img');
            img.style.display = 'none';

            const removeCoverInput = document.getElementById('editRemoveCoverImage');
            if (removeCoverInput) {
                removeCoverInput.value = 'true';
            }

            // Limpiar input file
            const fileInput = document.getElementById('editPostCoverImage');
            if (fileInput) {
                fileInput.value = '';
            }

            this.showMessage('Cover image will be removed', 'info');
        }
    }

    /**
     * Actualiza el post en el servidor
     */
    async updatePost() {
        try {
            this.log('🔄 Iniciando actualización de post...');

            if (!this.currentEditingPost) {
                throw new Error('No hay post seleccionado para editar');
            }

            const formData = new FormData();
            const postId = this.currentEditingPost._id;

            // Obtener valores del formulario
            const title = document.getElementById('editPostTitle').value.trim();
            const content = document.getElementById('editPostContent').value.trim();
            const tags = document.getElementById('editPostTags').value.trim();
            const published = document.querySelector('input[name="editPostPublished"]:checked').value;
            const removeCoverImage = document.getElementById('editRemoveCoverImage')?.value || 'false';

            console.log('📝 Datos del formulario:', {
                title,
                contentLength: content.length,
                tags,
                published,
                removeCoverImage
            });

            // Validaciones
            if (!title) {
                this.showMessage('Title is required', 'error');
                return;
            }

            if (!content) {
                this.showMessage('Content is required', 'error');
                return;
            }

            if (title.length > 200) {
                this.showMessage('Title must be less than 200 characters', 'error');
                return;
            }

            // Preparar datos para enviar
            formData.append('title', title);
            formData.append('content', content);
            formData.append('tags', tags);
            formData.append('published', published);
            formData.append('removeCoverImage', removeCoverImage);

            // Agregar archivo de imagen si existe
            const coverImageInput = document.getElementById('editPostCoverImage');
            if (coverImageInput && coverImageInput.files[0]) {
                formData.append('coverImage', coverImageInput.files[0]);
                console.log('🖼️ Archivo de imagen agregado:', coverImageInput.files[0].name);
            }

            // Mostrar loading
            this.showEditLoading(true);

            const url = `/api/posts/${postId}`;
            console.log('🌐 Enviando solicitud PUT a:', url);

            // Enviar solicitud
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                },
                body: formData
            });

            console.log('📡 Response de actualización:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            const data = await response.json();
            console.log('📡 Data de respuesta:', data);

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'Error updating post');
            }

            this.showMessage(data.message, 'success');

            // Cerrar modal y recargar
            this.closeEditForm();

            console.log('✅ Post actualizado exitosamente');

        } catch (error) {
            console.error('❌ Error updating post:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.showEditLoading(false);
        }
    }

    /**
     * Guarda el post como borrador
     */
    saveAsDraft() {
        const publishedRadio = document.querySelector('input[name="editPostPublished"][value="false"]');
        if (publishedRadio) {
            publishedRadio.checked = true;
        }
        this.updatePost();
    }

    /**
     * Cierra el formulario de edición
     */
    closeEditForm() {
        const modal = document.getElementById('editPostModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
        this.currentEditingPost = null;
        console.log('✅ Formulario de edición cerrado');
    }

    /**
     * Muestra/oculta el indicador de carga
     * @param {boolean} show - Mostrar u ocultar
     */
    showEditLoading(show) {
        const updateBtn = document.querySelector('#editPostModal .btn--primary');
        const draftBtn = document.querySelector('#editPostModal .btn--secondary');
        const cancelBtn = document.querySelector('#editPostModal .btn--outline');

        if (updateBtn) {
            if (show) {
                updateBtn.innerHTML = '<i class="fas fa-spinner loading-spinner"></i> Updating Post...';
                updateBtn.disabled = true;
                if (draftBtn) draftBtn.disabled = true;
                if (cancelBtn) cancelBtn.disabled = true;
                updateBtn.style.opacity = '0.8';
            } else {
                updateBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Update Post';
                updateBtn.disabled = false;
                if (draftBtn) draftBtn.disabled = false;
                if (cancelBtn) cancelBtn.disabled = false;
                updateBtn.style.opacity = '1';
            }
        }
    }

    /**
     * Muestra un mensaje toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje
     */
    showMessage(message, type = 'success') {
        // Remover toasts anteriores
        const existingToasts = document.querySelectorAll('.post-edit-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'post-edit-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${this.getToastColor(type)};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animación de entrada
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.style.transition = 'transform 0.3s ease';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remover con animación
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Obtiene el color del toast según el tipo
     * @param {string} type - Tipo de mensaje
     * @returns {string} Color en hexadecimal
     */
    getToastColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} unsafe - Texto sin escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// =====================================================================
// SECCIÓN 16: FUNCIONES GLOBALES Y EVENT HANDLERS
// =====================================================================

/**
 * Funciones globales para ser accedidas desde event handlers en HTML
 * Estas funciones actúan como puente entre el HTML y la lógica de la aplicación
 */

// Toggle de comentarios
window.toggleComments = (postId) => window.devCommunity?.commentSystem.toggleComments(postId);

// Agregar reacción a post
window.addReaction = (postId, reactionType) => window.devCommunity?.addReaction(postId, reactionType);

// Toggle de favoritos
window.toggleFavorite = (postId) => window.devCommunity?.toggleFavorite(postId);

// Agregar comentario
window.addComment = (postId) => window.devCommunity?.commentSystem.addComment(postId);

// Ver post (abrir comentarios)
window.viewPost = (postId) => window.devCommunity?.viewPost(postId);

// Eliminar post
window.deletePost = (postId) => window.devCommunity?.postDeletionSystem?.showDeleteConfirmation(postId);

// Editar post
window.editPost = (postId) => window.devCommunity?.postEditSystem?.showEditForm(postId);

// =====================================================================
// SECCIÓN 17: INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================================

/**
 * Función principal de inicialización de la aplicación
 * Configura todos los sistemas y los pone en marcha
 */
function init() {
    console.log('Initializing DEV Community with Comment System...');

    // Sincronizar autenticación inmediatamente
    if (authManager) {
        authManager.syncAuthState();
    }

    // Configurar sistemas básicos
    setupImageErrorHandlers();
    initUserDropdown();
    renderTags();
    initMinibar();

    // Inicializa la aplicación principal
    window.devCommunity = new DevCommunity();

    // Verificar autenticación después de inicializar
    setTimeout(() => {
        if (window.devCommunity) {
            window.devCommunity.checkAndSyncAuth();
        }
    }, 500);

    console.log('DEV Community with Comment System initialized successfully');
}

/**
 * Función global para debugging de autenticación
 * Útil para troubleshooting desde la consola del navegador
 */
window.debugAuth = function () {
    console.log('🔐 DEBUG DE AUTENTICACIÓN COMPLETO:');
    console.log('====================================');
    console.log('1. AuthManager:');
    console.log('   - isAuthenticated:', authManager.isAuthenticated);
    console.log('   - token:', authManager.token ? `PRESENTE (${authManager.token.length} chars)` : 'AUSENTE');

    console.log('2. DevCommunity:');
    console.log('   - currentUser:', window.devCommunity?.currentUser ? 'PRESENTE' : 'AUSENTE');
    console.log('   - currentUser data:', window.devCommunity?.currentUser);

    console.log('3. localStorage:');
    console.log('   - jwtToken:', localStorage.getItem('jwtToken') ? 'PRESENTE' : 'AUSENTE');
    console.log('   - userLoggedIn:', localStorage.getItem('userLoggedIn'));

    console.log('4. Session:');
    console.log('   - sessionStorage user:', sessionStorage.getItem('user'));

    console.log('5. Verificando endpoint /api/user...');

    // Probar el endpoint de usuario
    fetch('/api/user', {
        headers: {
            'Authorization': `Bearer ${authManager.token}`
        }
    })
        .then(response => {
            console.log('   - /api/user status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('   - /api/user response:', data);
        })
        .catch(error => {
            console.log('   - /api/user error:', error);
        });
};

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(init, 100);
});

// Inicialización adicional para el dropdown del usuario
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado. Inicializando dropdown...");
    initUserDropdown();
});

// =====================================================================
// SECCIÓN 18: DETECCIÓN DE DISPOSITIVO Y FUNCIONALIDAD MÓVIL
// =====================================================================

/**
 * Funciones para detección de dispositivo y funcionalidad móvil específica
 */

/**
 * Detecta si el dispositivo es móvil
 * @returns {boolean} True si es dispositivo móvil
 */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/**
 * Detecta si el dispositivo es tablet
 * @returns {boolean} True si es tablet
 */
function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/**
 * Detecta si el dispositivo es desktop
 * @returns {boolean} True si es desktop
 */
function isDesktopDevice() {
    return window.innerWidth > 1024;
}

/**
 * Funcionalidad de búsqueda móvil
 * Maneja el toggle del campo de búsqueda en dispositivos móviles
 */
document.addEventListener('DOMContentLoaded', function () {
    const searchToggle = document.getElementById('searchToggle');
    const mobileSearch = document.getElementById('mobileSearch');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const searchClose = document.getElementById('searchClose');
    const body = document.body;

    if (searchToggle && mobileSearch) {
        // Abrir búsqueda móvil
        searchToggle.addEventListener('click', function () {
            mobileSearch.classList.add('active');
            body.classList.add('search-open');
            setTimeout(() => {
                mobileSearchInput.focus();
            }, 100);
        });

        /**
         * Cierra la búsqueda móvil
         */
        function closeSearch() {
            mobileSearch.classList.remove('active');
            body.classList.remove('search-open');
            mobileSearchInput.blur();
        }

        // Cerrar con botón de cerrar
        searchClose.addEventListener('click', closeSearch);

        // Cerrar con tecla Escape
        mobileSearchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeSearch();
                searchToggle.focus();
            }
        });

        // Cerrar al hacer clic fuera (en el overlay)
        document.addEventListener('click', function (event) {
            if (mobileSearch.classList.contains('active') &&
                !mobileSearch.contains(event.target) &&
                !searchToggle.contains(event.target)) {
                closeSearch();
            }
        });
    }
});

// =====================================================================
// SECCIÓN 19: MANEJO DE PROMO PARA USUARIOS GUEST
// =====================================================================

/**
 * Clase que maneja la visualización de promociones para usuarios no autenticados
 * Oculta/muestra promociones según el estado de autenticación
 */
class PromoManager {
    constructor() {
        this.promo = document.getElementById("promoGuest");
        this.isInitialized = false;
        this.init();
    }

    /**
     * Inicializa el sistema de promociones
     */
    init() {
        if (!this.promo) {
            console.log("❌ Promo element not found");
            return;
        }

        console.log("✅ PromoManager inicializado");
        this.isInitialized = true;
        
        // Verificación inmediata al inicializar
        this.checkAndToggle();
        
        // Configurar listeners para cambios de autenticación
        this.setupAuthListener();
        this.setupStorageListener();
        this.setupDevCommunityObserver();
    }

    /**
     * Verifica y actualiza el estado de la promo
     */
    checkAndToggle() {
        if (!this.isInitialized) return;

        const isAuthenticated = this.checkAuthentication();
        console.log("🔐 Estado de autenticación:", isAuthenticated);
        
        // Mostrar/ocultar según autenticación
        if (isAuthenticated) {
            this.hidePromo();
        } else {
            this.showPromo();
        }
    }

    /**
     * Verifica el estado de autenticación mediante múltiples métodos
     * @returns {boolean} True si el usuario está autenticado
     */
    checkAuthentication() {
        return (
            localStorage.getItem("jwtToken") !== null ||
            localStorage.getItem("userLoggedIn") === 'true' ||
            (window.devCommunity && window.devCommunity.currentUser) ||
            (authManager && authManager.isAuthenticated) ||
            document.body.classList.contains('user-logged-in')
        );
    }

    /**
     * Oculta la promo (usuario autenticado)
     */
    hidePromo() {
        if (this.promo.style.display !== "none") {
            this.promo.style.display = "none";
            console.log("🎯 Promo ocultada inmediatamente");
        }
    }

    /**
     * Muestra la promo (usuario no autenticado)
     */
    showPromo() {
        if (this.promo.style.display !== "block") {
            this.promo.style.display = "block";
            console.log("🎯 Promo mostrada inmediatamente");
        }
    }

    /**
     * Configura listeners para cambios en AuthManager
     */
    setupAuthListener() {
        // Sobrescribir métodos del AuthManager para detectar cambios
        const originalSetToken = authManager.setToken;
        const originalClearToken = authManager.clearToken;

        authManager.setToken = function(token) {
            originalSetToken.call(this, token);
            console.log("🔄 Token establecido - ocultando promo");
            window.promoManager?.hidePromo();
        };

        authManager.clearToken = function() {
            originalClearToken.call(this);
            console.log("🔄 Token eliminado - mostrando promo");
            window.promoManager?.showPromo();
        };
    }

    /**
     * Configura listeners para cambios en localStorage
     */
    setupStorageListener() {
        // Escuchar cambios en otras pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'jwtToken' || e.key === 'userLoggedIn') {
                console.log("📦 Cambio en localStorage detectado");
                setTimeout(() => this.checkAndToggle(), 10);
            }
        });

        // Interceptar escrituras en localStorage
        this.interceptLocalStorage();
    }

    /**
     * Intercepta operaciones en localStorage para detectar cambios
     */
    interceptLocalStorage() {
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;

        localStorage.setItem = function(key, value) {
            originalSetItem.call(this, key, value);
            if (key === 'jwtToken' || key === 'userLoggedIn') {
                console.log("✏️ Escritura en localStorage:", key);
                setTimeout(() => window.promoManager?.checkAndToggle(), 10);
            }
        };

        localStorage.removeItem = function(key) {
            originalRemoveItem.call(this, key);
            if (key === 'jwtToken' || key === 'userLoggedIn') {
                console.log("🗑️ Eliminación de localStorage:", key);
                setTimeout(() => window.promoManager?.checkAndToggle(), 10);
            }
        };
    }

    /**
     * Observa cambios en devCommunity para detectar autenticación
     */
    setupDevCommunityObserver() {
        // Observar cuando devCommunity se inicialice o cambie
        let checkCount = 0;
        const maxChecks = 50; // Máximo 5 segundos

        const checkDevCommunity = () => {
            checkCount++;
            
            if (window.devCommunity && window.devCommunity.currentUser) {
                console.log("🎯 DevCommunity detectado - ocultando promo");
                this.hidePromo();
                return;
            }

            if (checkCount < maxChecks) {
                setTimeout(checkDevCommunity, 100);
            }
        };

        checkDevCommunity();
    }
}

// Inicialización inmediata del PromoManager
document.addEventListener("DOMContentLoaded", () => {
    window.promoManager = new PromoManager();
});

/**
 * Mejora el sistema de autenticación para integrarse con el PromoManager
 */
function enhanceAuthSystem() {
    // Sobrescribir funciones de login/logout globales
    const originalLogout = authManager.logout;
    
    authManager.logout = async function() {
        console.log("🚪 Logout iniciado - mostrando promo");
        // Mostrar promo inmediatamente al iniciar logout
        window.promoManager?.showPromo();
        await originalLogout.call(this);
    };

    // Integrar con handleLoginSuccess si existe
    if (window.handleLoginSuccess) {
        const originalLoginSuccess = window.handleLoginSuccess;
        window.handleLoginSuccess = function(userData) {
            console.log("🔑 Login exitoso - ocultando promo");
            window.promoManager?.hidePromo();
            return originalLoginSuccess(userData);
        };
    }
}

// Ejecutar las mejoras después de que cargue todo
setTimeout(enhanceAuthSystem, 1000);