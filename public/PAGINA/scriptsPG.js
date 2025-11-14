// =====================================================================
// SECCIÓN 1: DECLARACIÓN DE ELEMENTOS DEL DOM
// =====================================================================

// Elementos principales de la interfaz
const articlesEl = document.getElementById('articles');
const loadingEl = document.getElementById('loading');
const popularTagsEl = document.getElementById('popularTags');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

// Elementos de navegación y autenticación
const tabs = document.querySelectorAll('.tab');
const authActions = document.getElementById('authActions');
const userNav = document.getElementById('userNav');
const userAvatar = document.getElementById('userAvatar');
const dropdownAvatar = document.getElementById('dropdownAvatar');
const dropdownUsername = document.getElementById('dropdownUsername');
const dropdownEmail = document.getElementById('dropdownEmail');
const userDropdown = document.getElementById('userDropdown');

// Elementos del menú responsive
const menuToggle = document.getElementById('menuToggle');
const leftbar = document.getElementById('leftbar');
const minibar = document.getElementById('minibar');

// =====================================================================
// SECCION 2: SISTEMA DE AUTENTICACION - AUTH MANAGER
// =====================================================================

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('jwtToken');
        this.isAuthenticated = !!this.token;
    }

    syncAuthState() {
        console.log('🔄 Sincronizando estado de autenticacion...');

        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken && !this.token) {
            console.log('🔄 Token encontrado en localStorage, actualizando authManager');
            this.token = storedToken;
            this.isAuthenticated = true;
        }

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

    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };
        }
        return { 'Content-Type': 'application/json' };
    }

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

    setToken(token) {
        this.token = token;
        this.isAuthenticated = true;
        localStorage.setItem('jwtToken', token);
    }

    clearToken() {
        console.log("🗑 Eliminando token JWT...");
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('jwtToken');
    }

    clearAuthCookies() {
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    clearAllUserData() {
        console.log("🧹 Limpiando todos los datos del usuario...");

        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userLoggedIn');

        sessionStorage.clear();
        this.clearAuthCookies();

        this.token = null;
        this.isAuthenticated = false;

        console.log("✔ Datos de usuario completamente eliminados");
    }

    clearAllCache() {
        if (window.devCommunity && window.devCommunity.commentSystem) {
            window.devCommunity.commentSystem.commentsCache.clear();
        }

        window.currentUser = null;
        window.userData = null;

        console.log("🧹 Cache limpiada");
    }

    // ============================================================
    // LOGOUT REAL Y FUNCIONAL — YA NO USA TOKEN BORRADO
    // ============================================================
    async logout() {
        try {
            console.log("🚪 Iniciando logout...");

            // Guardamos el token temporalmente ANTES de borrarlo
            const tokenToInvalidate = this.token;

            // 1. Limpiar localmente ANTES DE TODO
            this.clearAllUserData();

            // 2. Intentar logout en backend SI existía token
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

            // 3. Limpiar cache
            this.clearAllCache();

            // 4. Redirigir
            window.location.href = '/login.html';

        } catch (error) {
            console.error("❌ Error en logout:", error);
            this.clearAllUserData();
            window.location.href = '/login.html';
        }
    }
}

// Instancia global del AuthManager
const authManager = new AuthManager();


// =====================================================================
// SECCION 3: RESPONSIVE NAV (COMPLETO TAL CUAL)
// =====================================================================

document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menuToggle');
    const leftbar = document.getElementById('leftbar');
    const body = document.body;

    let mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobileOverlay';
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
    }

    let isMenuOpen = false;

    function openMobileMenu() {
        leftbar.classList.add('open');
        mobileOverlay.classList.add('active');
        body.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.innerHTML = '✕';
        isMenuOpen = true;
    }

    function closeMobileMenu() {
        leftbar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '☰';
        isMenuOpen = false;
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            isMenuOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    mobileOverlay.addEventListener('click', closeMobileMenu);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isMenuOpen) closeMobileMenu();
    });

    const mobileLinks = leftbar.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (!this.href.startsWith('http') && window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && isMenuOpen) closeMobileMenu();
        updateHamburgerVisibility();
    });

    leftbar.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', function (e) {
        if (isMenuOpen && !leftbar.contains(e.target) && e.target !== menuToggle) {
            closeMobileMenu();
        }
    });

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

    function updateHamburgerVisibility() {
        menuToggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        if (window.innerWidth > 768) closeMobileMenu();
    }

    function initialize() {
        updateUserState();
        updateHamburgerVisibility();
    }

    initialize();
    window.addEventListener('resize', updateHamburgerVisibility);
});


// =====================================================================
// SECCION 4: MODAL DE LOGOUT (COMPLETO)
// =====================================================================

window.handleLogout = function (event) {
    if (event) event.preventDefault();
    const logoutModal = document.getElementById('logoutModal');
    logoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

document.addEventListener('DOMContentLoaded', function () {
    const logoutModal = document.getElementById('logoutModal');
    const logoutConfirm = document.getElementById('logoutConfirm');
    const logoutCancel = document.getElementById('logoutCancel');
    const modalOverlay = logoutModal.querySelector('.modal__overlay');

    if (logoutConfirm) {
        logoutConfirm.addEventListener('click', async function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
            await authManager.logout();
        });
    }

    if (logoutCancel) {
        logoutCancel.addEventListener('click', function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function () {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && logoutModal.style.display === 'flex') {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});


// =====================================================================
// SECCION 5: REQUESTS AUTENTICADOS (COMPLETOS)
// =====================================================================

async function makeAuthenticatedRequest(url, options = {}) {
    const authHeaders = authManager.getAuthHeaders();

    const config = {
        ...options,
        headers: {
            ...authHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401 && authManager.token) {
            console.log('Token expirado, intentando refresh...');
            const refreshed = await refreshToken();
            if (refreshed) {
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

    authManager.clearToken();
    window.location.href = '/';
    return false;
}


// =====================================================================
// SECCION 6 y 7: AVATARS Y AUTH UI (COMPLETO)
// =====================================================================

function handleImageError(img) {
    img.src = '/IMAGENES/default-avatar.png';
    img.alt = 'Default Avatar';
}

function setupImageErrorHandlers() {
    if (userAvatar) userAvatar.addEventListener('error', () => handleImageError(userAvatar));
    if (dropdownAvatar) dropdownAvatar.addEventListener('error', () => handleImageError(dropdownAvatar));
}

async function checkAuth() {
    try {
        console.log('🔐 Verificando estado de autenticacion...');

        const token = localStorage.getItem('jwtToken');

        if (!token) {
            console.log('❌ No hay token');
            showUnauthenticatedState();
            return null;
        }

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

function showAuthenticatedState(user) {
    if (authActions) authActions.style.display = 'none';
    if (userNav) userNav.style.display = 'flex';

    const profilePic = user.profilePicture || user.avatar || '/IMAGENES/default-avatar.png';

    if (userAvatar) {
        userAvatar.src = profilePic;
        userAvatar.alt = user.username;
    }

    if (dropdownAvatar) {
        dropdownAvatar.src = profilePic;
        dropdownAvatar.alt = user.username;
    }

    if (dropdownUsername) dropdownUsername.textContent = user.username;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
}

function showUnauthenticatedState() {
    if (authActions) authActions.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
    resetUserInfo();
}

function resetUserInfo() {
    const defaultAvatar = '/IMAGENES/default-avatar.png';
    if (userAvatar) userAvatar.src = defaultAvatar;
    if (dropdownAvatar) dropdownAvatar.src = defaultAvatar;
    if (dropdownUsername) dropdownUsername.textContent = 'Username';
    if (dropdownEmail) dropdownEmail.textContent = 'user@example.com';
}

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

    if (!userAvatar || !userDropdown || !userNav) {
        console.log('User dropdown elements not found:', {
            userAvatar: !!userAvatar,
            userDropdown: !!userDropdown,
            userNav: !!userNav
        });
        return;
    }

    console.log('Initializing user dropdown...');

    // Asegurar que el dropdown esté oculto inicialmente
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

    // También cerrar con la tecla Escape
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
 * Renderiza la lista de tags populares
 */
function renderTags() {
    if (!popularTagsEl) return;

    const popularTags = ['javascript', 'webdev', 'python', 'devops', 'react', 'nodejs', 'ai', 'machinelearning'];

    popularTagsEl.innerHTML = '';
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
        this.devCommunity = devCommunity;
        this.commentsCache = new Map();
        this.debug = true;
    }

    /**
     * Logging para debugging del sistema de comentarios
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
            await this.loadComments(postId);
            commentsSection.style.display = 'block';

            // Agregar animación suave
            commentsSection.style.opacity = '0';
            commentsSection.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                commentsSection.style.transition = 'all 0.3s ease';
                commentsSection.style.opacity = '1';
                commentsSection.style.transform = 'translateY(0)';
            }, 10);

        } else {
            // Animación al cerrar
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

            // Verificar si ya tenemos comentarios en cache
            if (this.commentsCache.has(postId)) {
                const cachedComments = this.commentsCache.get(postId);
                this.log(`Using cached comments: ${cachedComments.length} comments`);
                this.renderComments(postId, cachedComments);
                return;
            }

            // Intentar cargar comentarios desde la API
            const response = await fetch(`/api/posts/${postId}/comments`);

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

            // Cachear los comentarios
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

        // Manejar diferentes formatos de comentario
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
        if (!this.devCommunity.currentUser) {
            window.location.href = '/Login.html';
            return;
        }

        const commentInput = document.getElementById(`comment-input-${postId}`);
        const content = commentInput?.value.trim();

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

            // Si hay error 500 pero el comentario se creó en la base de datos
            if (!response.ok) {
                // Intentar verificar si el comentario se creó de todas formas
                await this.verifyAndHandleCommentCreation(postId, content, commentInput);
                return;
            }

            // Si la respuesta es exitosa
            this.handleCommentSuccess(postId, data, commentInput);

        } catch (error) {
            console.error('Error adding comment:', error);
            // Intentar verificar si el comentario se creó a pesar del error
            await this.verifyAndHandleCommentCreation(postId, content, commentInput);
        }
    }

    /**
     * Verifica si un comentario se creó exitosamente a pesar de errores del servidor
     */
    async verifyAndHandleCommentCreation(postId, content, commentInput) {
        try {
            this.log('Verifying if comment was created despite server error...');

            // Esperar un momento para dar tiempo al servidor
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar comentarios para verificar
            this.commentsCache.delete(postId);
            await this.loadComments(postId);

            const currentComments = this.commentsCache.get(postId) || [];
            this.log(`Current comments after verification: ${currentComments.length}`);

            // Buscar si nuestro comentario está en la lista
            const newCommentExists = currentComments.some(comment =>
                comment.content === content ||
                (comment.content && comment.content.includes(content.substring(0, 50)))
            );

            if (newCommentExists) {
                // El comentario se creó exitosamente a pesar del error del servidor
                this.log('Comment was successfully created despite server error');
                this.handleCommentSuccess(postId, null, commentInput);
            } else {
                // El comentario realmente no se creó
                this.showCommentError(postId, 'Error adding comment to database. Please try again.');
            }
        } catch (verifyError) {
            console.error('Error verifying comment creation:', verifyError);
            this.showCommentError(postId, 'Error adding comment. Please try again.');
        }
    }

    /**
     * Maneja el éxito en la creación de un comentario
     */
    handleCommentSuccess(postId, commentData, commentInput) {
        this.log('Handling comment success', { postId, commentData });

        // Limpiar el input
        if (commentInput) commentInput.value = '';

        // Invalidar cache y recargar comentarios
        this.commentsCache.delete(postId);
        this.loadComments(postId);

        // Actualizar contador de comentarios
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

        // Enfocar el textarea
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

        if (!newContent) {
            this.showMessage('Comment cannot be empty', 'error');
            return;
        }

        if (newContent.length > 1000) {
            this.showMessage('Comment must be less than 1000 characters', 'error');
            return;
        }

        try {
            // Usar el mismo endpoint que para crear comentarios pero con método PUT
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
                    // Recargar los comentarios del post desde la base de datos
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId); // Limpiar cache
                        await this.loadComments(postId);
                    }
                    this.showMessage('Comment updated successfully!', 'success');
                } else {
                    throw new Error('Failed to update comment');
                }
            } else {
                // Si el endpoint no existe, manejar localmente
                this.handleLocalCommentEdit(commentId, newContent);
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            // En caso de error, manejar localmente
            this.handleLocalCommentEdit(commentId, newContent);
        }
    }

    /**
     * Maneja la edición de comentarios localmente (fallback)
     */
    handleLocalCommentEdit(commentId, newContent) {
        this.log(`Handling local comment edit: ${commentId}`);

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const postId = this.getPostIdFromComment(commentId);
        if (!postId) return;

        // Obtener comentarios actuales del cache
        const currentComments = this.commentsCache.get(postId) || [];

        // Actualizar el comentario en el cache
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

        // Actualizar cache
        this.commentsCache.set(postId, updatedComments);

        // Re-renderizar comentarios
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

        // Recargar los comentarios del post para cancelar la edición
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
                    // Recargar los comentarios del post desde la base de datos
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId); // Limpiar cache
                        await this.loadComments(postId);
                        this.updateCommentCount(postId, -1);
                    }
                    this.showMessage('Comment deleted successfully!', 'success');
                } else {
                    throw new Error('Failed to delete comment');
                }
            } else {
                // Si el endpoint no existe, manejar localmente
                this.handleLocalCommentDelete(commentId);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            // En caso de error, manejar localmente
            this.handleLocalCommentDelete(commentId);
        }
    }

    /**
     * Maneja la eliminación de comentarios localmente (fallback)
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

        // Obtener comentarios actuales del cache
        const currentComments = this.commentsCache.get(postId) || [];
        this.log(`Current comments before deletion: ${currentComments.length}`);

        // Filtrar el comentario a eliminar
        const updatedComments = currentComments.filter(comment => {
            const id = comment._id || comment.id;
            return id !== commentId;
        });

        this.log(`Comments after deletion: ${updatedComments.length}`);

        // Actualizar cache
        this.commentsCache.set(postId, updatedComments);

        // Re-renderizar comentarios
        this.renderComments(postId, updatedComments);

        // Actualizar contador de comentarios - RESTAR 1
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
                    // Recargar comentarios para mostrar el like actualizado
                    const postId = this.getPostIdFromComment(commentId);
                    if (postId) {
                        this.commentsCache.delete(postId);
                        await this.loadComments(postId);
                    }
                } else {
                    throw new Error('Failed to toggle like');
                }
            } else {
                // Si el endpoint no existe, manejar localmente
                this.handleLocalCommentLike(commentId);
            }
        } catch (error) {
            console.error('Error toggling comment like:', error);
            // En caso de error, manejar localmente
            this.handleLocalCommentLike(commentId);
        }
    }

    /**
     * Maneja los likes de comentarios localmente (fallback)
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
        // Configurar event listeners para el formulario de comentarios
        const commentInput = document.getElementById(`comment-input-${postId}`);
        const submitBtn = commentInput?.nextElementSibling;

        if (commentInput && submitBtn) {
            // Submit con Ctrl+Enter
            commentInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.addComment(postId);
                }
            });

            // Auto-resize del textarea
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
     */
    showCommentError(postId, message) {
        const commentInput = document.getElementById(`comment-input-${postId}`);
        if (!commentInput) return;

        // Remover errores anteriores
        const existingError = commentInput.parentNode.querySelector('.comment-error');
        if (existingError) {
            existingError.remove();
        }

        // Mostrar error temporal
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

        // Hacer scroll al error
        errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        setTimeout(() => {
            if (errorSection.parentNode) {
                errorSection.parentNode.removeChild(errorSection);
            }
        }, 5000);
    }

    /**
     * Muestra un mensaje de éxito en los comentarios
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

        setTimeout(() => {
            if (successSection.parentNode) {
                successSection.parentNode.removeChild(successSection);
            }
        }, 5000);
    }

    /**
     * Muestra un mensaje toast al usuario
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
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
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
        this.currentUser = null;
        this.posts = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMorePosts = true;
        this.commentSystem = new CommentSystem(this);
        this.postDeletionSystem = new PostDeletionSystem(this); // ← AGREGAR ESTA LÍNEA
        this.postEditSystem = new PostEditSystem(this); // ← NUEVA LÍNEA
        this.init();
    }

    /**
     * Verifica y sincroniza el estado de autenticación
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
     */
    handlePostsResponse(data, view) {
        let posts = [];

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
     */
    applyLocalFilters(posts, view) {
        console.log(`Applying local filter: ${view} to ${posts.length} posts`);

        switch (view) {
            case 'top':
                // Ordenar por total de reacciones (suma de todas las reacciones)
                return posts.sort((a, b) => {
                    const aReactions = this.calculateTotalReactions(a);
                    const bReactions = this.calculateTotalReactions(b);
                    return bReactions - aReactions;
                });

            case 'trending':
                // Ordenar por cantidad de corazones (reacción específica)
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
     */
    calculateTotalReactions(post) {
        if (!post.reactionCounts) return 0;

        return Object.values(post.reactionCounts).reduce((total, count) => {
            return total + (parseInt(count) || 0);
        }, 0);
    }

    /**
     * Maneja datos de ejemplo cuando la API no está disponible
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

        articlesContainer.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');

        // Asegurar que las tarjetas se vean bien
        const articleCards = articlesContainer.querySelectorAll('.article-card');
        articleCards.forEach(card => {
            card.style.opacity = '1';
            card.style.background = 'white';
        });
    }

    /**
         * Crea el HTML para un post individual
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

        return `
            <article class="article-card" data-post-id="${postId}" style="opacity: 1; background: white;">
                <section class="article-card__inner">
                    <header class="article-card__header">
                        <img src="${profilePicture}" alt="${username}" class="article-card__avatar" onerror="this.src='/IMAGENES/default-avatar.png'">
                        <section class="article-card__user-info">
                            <span class="article-card__username">${username}</span>
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

                <section class="article-card__content">
                    <h2 class="article-card__title">
                        <a href="#" onclick="devCommunity.viewPost('${postId}'); return false;">${post.title || 'Untitled Post'}</a>
                    </h2>
                    
                    ${post.coverImage ? `
                        <figure class="article-card__cover">
                            <img src="${post.coverImage}" alt="Cover image for ${post.title}" onerror="this.style.display='none'">
                        </figure>
                    ` : ''}

                    ${post.tags && post.tags.length > 0 ? `
                        <nav class="article-card__tags">
                            ${post.tags.map(tag => `
                                <span class="tag">#${tag}</span>
                            `).join('')}
                        </nav>
                    ` : ''}
                </section>

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
// SECCIÓN 14: FUNCIONALIDAD DE LA MINIBAR 
// =====================================================================

/**
 * Funcionalidad de la minibar con previews interactivos
 * Maneja los previews que aparecen al pasar el mouse sobre los íconos
 */
document.addEventListener('DOMContentLoaded', function () {
    // Obtener todos los elementos de la minibar (íconos como inicio, trending, etc.)
    const minibarItems = document.querySelectorAll('.minibar__item');
    // Variable para trackear el preview actualmente activo
    let activePreview = null;

    /**
     * Calcula la posición óptima del preview evitando que se salga de la pantalla
     * @param {HTMLElement} link - Elemento del enlace
     * @param {HTMLElement} preview - Elemento del preview
     * @returns {number} Posición top calculada
     */
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

    /**
     * Muestra el preview de un ítem específico
     * @param {HTMLElement} item - Elemento del ítem de la minibar
     */
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

    /**
     * Oculta un preview específico
     * @param {HTMLElement} preview - Elemento del preview a ocultar
     */
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
            item.addEventListener('mouseenter', function () {
                showPreview(item);
            });

            // Ocultar preview cuando el mouse sale del ítem
            // Se usa setTimeout para dar tiempo al usuario para mover el mouse al preview
            item.addEventListener('mouseleave', function (e) {
                setTimeout(() => {
                    // Verificar que el mouse no esté sobre el ítem o el preview
                    // Esto evita que el preview se oculte prematuramente
                    if (!item.matches(':hover') && !preview.matches(':hover')) {
                        hidePreview(preview);
                    }
                }, 100); // Delay de 100ms para mejor experiencia de usuario
            });

            // Mantener el preview visible cuando el mouse está sobre él
            preview.addEventListener('mouseenter', function () {
                preview.style.display = 'block';
            });

            // Ocultar preview cuando el mouse sale del preview
            preview.addEventListener('mouseleave', function () {
                hidePreview(preview);
            });
        }
    });

    // Ocultar todos los previews cuando el usuario hace scroll
    // Esto mejora la experiencia evitando previews en posiciones incorrectas
    window.addEventListener('scroll', function () {
        if (activePreview) {
            hidePreview(activePreview);
        }
    });
});

// =====================================================================
// SECCIÓN 15: SISTEMA DE ELIMINACIÓN DE POSTS CON BACKEND
// =====================================================================

/**
 * Clase que maneja la eliminación de posts
 */
class PostDeletionSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity;
        this.debug = true;
    }

    /**
     * Logging para debugging del sistema de eliminación
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
     * Agrega el botón de eliminar al HTML del post si el usuario es el autor
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

        // Configurar event listeners
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

            // 🔥 USAR makeAuthenticatedRequest EN LUGAR DE fetch DIRECTAMENTE
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

        // Encontrar y remover el post del array local
        const postIndex = this.devCommunity.posts.findIndex(post => {
            const id = post._id || post.id;
            return id === postId;
        });

        if (postIndex !== -1) {
            this.devCommunity.posts.splice(postIndex, 1);
            this.devCommunity.renderPosts();
        }

        this.showMessage('Post deleted successfully!', 'success');

        // Recargar los posts desde el servidor para asegurar consistencia
        await this.refreshPostsFromServer();
    }

    /**
     * Recarga los posts desde el servidor para mantener consistencia
     */
    async refreshPosts() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.posts = [];
        await this.loadPosts();
    }

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
// SECCIÓN 15.1: SISTEMA DE EDICIÓN DE POSTS CON DEBUGGING
// =====================================================================

/**
 * Clase que maneja la edición de posts
 */
class PostEditSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity;
        this.debug = true;
        this.currentEditingPost = null;
    }

    /**
     * Logging para debugging del sistema de edición
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
     * Agrega el botón de editar al HTML del post si el usuario es el autor
     * @param {Object} post - Datos del post
     * @returns {string} HTML del botón de editar
     */
    createEditButtonHTML(post) {
        if (!this.isUserPostAuthor(post)) {
            return '';
        }

        // Forzar sincronización de autenticación antes de mostrar el botón
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
 * Muestra el formulario de edición para un post - CORREGIDO
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

            // Si authManager no tiene token pero hay uno en localStorage, actualizarlo
            if (!authManager.token && localStorage.getItem('jwtToken')) {
                console.log('🔄 Actualizando token en authManager desde localStorage');
                authManager.token = localStorage.getItem('jwtToken');
                authManager.isAuthenticated = true;
            }

            // Mostrar indicador de carga
            this.showEditLoading(true);

            const url = `/api/posts/${postId}/edit`;
            console.log('🌐 Realizando request a:', url);

            // Preparar headers de autenticación
            const headers = {
                'Content-Type': 'application/json'
            };

            // Agregar token JWT si está disponible
            if (authManager.token) {
                headers['Authorization'] = `Bearer ${authManager.token}`;
                console.log('🔑 Token JWT agregado a headers');
            }

            console.log('📋 Headers de la solicitud:', headers);

            // Cargar datos del post con debugging extendido
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include' // Importante para cookies de sesión
            });

            console.log('📡 Response recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;

                // Intentar obtener más detalles del error
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

            // Mensajes más amigables para el usuario
            if (error.message.includes('401')) {
                userMessage = 'Please log in to edit posts';
                // Forzar recarga para renovar autenticación
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

        // Crear modal de edición mejorado
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

        // Configurar event listeners mejorados
        this.setupEditFormEvents();

        // Prevenir scroll del body
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

            // Efecto de foco mejorado
            titleInput.addEventListener('focus', () => {
                titleInput.parentNode.classList.add('focused');
            });
            titleInput.addEventListener('blur', () => {
                titleInput.parentNode.classList.remove('focused');
            });
        }

        // Efectos hover para los radio buttons
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
     * Actualiza el contador de caracteres del título con estilos mejorados
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
     */
    handleCoverImageChange(file) {
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select a valid image file', 'error');
            return;
        }

        // Validar tamaño (5MB)
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

                // Reemplazar input hidden
                const removeCoverInput = document.getElementById('editRemoveCoverImage');
                if (removeCoverInput) {
                    removeCoverInput.value = 'false';
                }

                // Agregar input file para el nuevo archivo
                let fileInput = document.getElementById('editPostCoverImage');
                if (!fileInput) {
                    fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.id = 'editPostCoverImage';
                    fileInput.name = 'coverImage';
                    fileInput.style.display = 'none';
                    currentCoverSection.appendChild(fileInput);
                }

                // Crear un FileList simulado (esto es un workaround)
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

            // Remover input file si existe
            const fileInput = document.getElementById('editPostCoverImage');
            if (fileInput) {
                fileInput.value = '';
            }

            this.showMessage('Cover image will be removed', 'info');
        }
    }

    /**
     * Actualiza el post - CON DEBUGGING MEJORADO
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

            // Preparar datos
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

            // Mostrar indicador de carga
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

            // Cerrar modal y recargar posts
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
     * Muestra/oculta el indicador de carga mejorado
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

                // Agregar efecto de desvanecimiento
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

// Funciones globales para los event handlers del HTML
window.toggleComments = (postId) => window.devCommunity?.commentSystem.toggleComments(postId);
window.addReaction = (postId, reactionType) => window.devCommunity?.addReaction(postId, reactionType);
window.toggleFavorite = (postId) => window.devCommunity?.toggleFavorite(postId);
window.addComment = (postId) => window.devCommunity?.commentSystem.addComment(postId);
window.viewPost = (postId) => window.devCommunity?.viewPost(postId);
window.deletePost = (postId) => window.devCommunity?.postDeletionSystem?.showDeleteConfirmation(postId);
// Función global para editar posts
window.editPost = (postId) => window.devCommunity?.postEditSystem?.showEditForm(postId);

// =====================================================================
// SECCIÓN 17: INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================================

/**
 * Función principal de inicialización de la aplicación
 */
function init() {
    console.log('Initializing DEV Community with Comment System...');

    // Sincronizar autenticación inmediatamente
    if (authManager) {
        authManager.syncAuthState();
    }

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

// Función global para debugging de autenticación
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

// También puedes llamar a debugAuth() desde la consola del navegador

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
// SECCIÓN 18: DETECCIÓN DE DISPOSITIVO
// =====================================================================

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktopDevice() {
    return window.innerWidth > 1024;
}



// Mobile Search Functionality
document.addEventListener('DOMContentLoaded', function () {
    const searchToggle = document.getElementById('searchToggle');
    const mobileSearch = document.getElementById('mobileSearch');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const searchClose = document.getElementById('searchClose');
    const body = document.body;

    if (searchToggle && mobileSearch) {
        // Abrir search
        searchToggle.addEventListener('click', function () {
            mobileSearch.classList.add('active');
            body.classList.add('search-open');
            setTimeout(() => {
                mobileSearchInput.focus();
            }, 100);
        });

        // Cerrar search
        function closeSearch() {
            mobileSearch.classList.remove('active');
            body.classList.remove('search-open');
            mobileSearchInput.blur();
        }

        searchClose.addEventListener('click', closeSearch);

        // Cerrar con Escape key
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



