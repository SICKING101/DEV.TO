// =====================================================================
// DOM ELEMENTS SECTION
// =====================================================================

const articlesEl = document.getElementById('articles');
const loadingEl = document.getElementById('loading');
const popularTagsEl = document.getElementById('popularTags');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const tabs = document.querySelectorAll('.tab');
const authActions = document.getElementById('authActions');
const userNav = document.getElementById('userNav');
const userAvatar = document.getElementById('userAvatar');
const dropdownAvatar = document.getElementById('dropdownAvatar');
const dropdownUsername = document.getElementById('dropdownUsername');
const dropdownEmail = document.getElementById('dropdownEmail');
const userDropdown = document.getElementById('userDropdown');
const menuToggle = document.getElementById('menuToggle');
const leftbar = document.getElementById('leftbar');
const minibar = document.getElementById('minibar');

// =====================================================================
// MINIBAR FUNCTIONALITY SECTION
// =====================================================================

function initMinibar() {
    const minibarItems = document.querySelectorAll('.minibar__item');
    
    minibarItems.forEach(item => {
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');
        
        link.addEventListener('mouseenter', () => {
            minibarItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('minibar__item--preview');
                }
            });
            item.classList.add('minibar__item--preview');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('minibar__item--preview');
        });
    });
}

// =====================================================================
// IMAGE HANDLING SECTION
// =====================================================================

function handleImageError(img) {
    console.warn('Failed to load profile image, using default');
    img.src = '/IMAGENES/default-avatar.png';
    img.alt = 'Default Avatar';
}

function setupImageErrorHandlers() {
    if (userAvatar) {
        userAvatar.addEventListener('error', () => handleImageError(userAvatar));
    }
    if (dropdownAvatar) {
        dropdownAvatar.addEventListener('error', () => handleImageError(dropdownAvatar));
    }
}

// =====================================================================
// AUTHENTICATION SECTION
// =====================================================================

async function checkAuth() {
    try {
        console.log('Checking authentication status...');
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Auth response:', data);
        
        if (data.user && data.user.id) {
            showAuthenticatedState(data.user);
            return data.user;
        } else {
            showUnauthenticatedState();
            return null;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showUnauthenticatedState();
        return null;
    }
}

function showAuthenticatedState(user) {
    console.log('Showing authenticated state for user:', user);
    
    // Mostrar/ocultar elementos de navegación
    if (authActions) authActions.style.display = 'none';
    if (userNav) userNav.style.display = 'flex';

    // Obtener datos del usuario
    const profilePic = user.profilePicture || user.avatar || '/IMAGENES/default-avatar.png';
    const username = user.username || user.name || 'User';
    const email = user.email || 'user@example.com';
    const displayName = user.displayName || username;

    console.log('User data to display:', { profilePic, username, email, displayName });

    // Actualizar avatar principal
    if (userAvatar) {
        userAvatar.src = profilePic;
        userAvatar.alt = username;
        userAvatar.onerror = () => handleImageError(userAvatar);
    }

    // Actualizar dropdown del usuario
    if (dropdownAvatar) {
        dropdownAvatar.src = profilePic;
        dropdownAvatar.alt = username;
        dropdownAvatar.onerror = () => handleImageError(dropdownAvatar);
    }
    
    if (dropdownUsername) {
        dropdownUsername.textContent = displayName;
    }
    
    if (dropdownEmail) {
        dropdownEmail.textContent = email;
    }

    console.log('Dropdown updated with user info');
}

function showUnauthenticatedState() {
    console.log('Showing unauthenticated state');
    if (authActions) authActions.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
    resetUserInfo();
}

function resetUserInfo() {
    const defaultAvatar = '/IMAGENES/default-avatar.png';
    const defaultUsername = 'Username';
    const defaultEmail = 'user@example.com';

    if (userAvatar) {
        userAvatar.src = defaultAvatar;
        userAvatar.alt = 'Default Avatar';
    }
    
    // Resetear dropdown también
    if (dropdownAvatar) {
        dropdownAvatar.src = defaultAvatar;
        dropdownAvatar.alt = 'Default Avatar';
    }
    
    if (dropdownUsername) {
        dropdownUsername.textContent = defaultUsername;
    }
    
    if (dropdownEmail) {
        dropdownEmail.textContent = defaultEmail;
    }
}

// =====================================================================
// USER DROPDOWN SECTION
// =====================================================================

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
// TAGS SECTION
// =====================================================================

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
// COMENTARIOS SECTION - SISTEMA COMPLETO CORREGIDO
// =====================================================================

class CommentSystem {
    constructor(devCommunity) {
        this.devCommunity = devCommunity;
        this.commentsCache = new Map();
        this.debug = true;
    }

    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[CommentSystem] ${message}`, data);
            } else {
                console.log(`[CommentSystem] ${message}`);
            }
        }
    }

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

    renderComments(postId, comments) {
        const container = document.getElementById(`comments-container-${postId}`);
        if (!container) {
            console.error(`Comments container not found for post: ${postId}`);
            return;
        }

        this.log(`Rendering ${comments.length} comments for post: ${postId}`);

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comments" style="font-size: 32px; color: #ccc; margin-bottom: 8px;"></i>
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = comments.map(comment => this.createCommentHTML(comment)).join('');
        
        this.log(`Successfully rendered ${comments.length} comments`);
    }

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
            <div class="comment" data-comment-id="${commentId}">
                <img src="${profilePicture}" alt="${username}" class="comment__avatar" onerror="this.src='/IMAGENES/default-avatar.png'">
                <div class="comment__content">
                    <div class="comment__header">
                        <div class="comment__user-info">
                            <span class="comment__username">${username}</span>
                            ${isCurrentUser ? '<span class="comment__badge">You</span>' : ''}
                        </div>
                        <div class="comment__actions">
                            <span class="comment__date">${commentDate}</span>
                            ${isCurrentUser ? `
                                <button class="comment__action-btn" onclick="devCommunity.commentSystem.editComment('${commentId}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="comment__action-btn comment__action-btn--danger" onclick="devCommunity.commentSystem.deleteComment('${commentId}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="comment__text">${this.escapeHtml(comment.content || comment.text || '')}</div>
                    
                    ${comment.editedAt ? `
                        <div class="comment__edited">
                            <small>Edited ${new Date(comment.editedAt).toLocaleDateString()}</small>
                        </div>
                    ` : ''}
                    
                    <div class="comment__footer">
                        <button class="comment__like-btn ${comment.hasLiked ? 'comment__like-btn--active' : ''}" 
                                onclick="devCommunity.commentSystem.toggleCommentLike('${commentId}')">
                            <i class="fas fa-heart"></i>
                            <span class="comment__like-count">${comment.likesCount || comment.likes || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

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

handleCommentSuccess(postId, newComment) {
    this.log('Handling comment success', { postId, newComment });
    
    // Limpiar el input
    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (commentInput) commentInput.value = '';
    
    // Invalidar cache y recargar comentarios
    this.commentsCache.delete(postId);
    this.loadComments(postId);
    
    // Actualizar contador de comentarios
    this.updateCommentCount(postId, 1);
    
    this.showCommentSuccess(postId, 'Comment added successfully!');
}

    async editComment(commentId) {
        this.log(`Edit comment: ${commentId}`);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const commentText = commentElement.querySelector('.comment__text');
        const currentContent = commentText.textContent;

        // Crear formulario de edición
        commentText.innerHTML = `
            <div class="comment-edit-form">
                <textarea class="comment-edit-input" rows="3">${this.escapeHtml(currentContent)}</textarea>
                <div class="comment-edit-actions">
                    <button class="btn btn--small btn--primary" onclick="devCommunity.commentSystem.saveCommentEdit('${commentId}')">
                        Save
                    </button>
                    <button class="btn btn--small btn--secondary" onclick="devCommunity.commentSystem.cancelCommentEdit('${commentId}')">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        // Enfocar el textarea
        const textarea = commentText.querySelector('.comment-edit-input');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

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

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

showCommentError(postId, message) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (!commentInput) return;

    // Remover errores anteriores
    const existingError = commentInput.parentNode.querySelector('.comment-error');
    if (existingError) {
        existingError.remove();
    }

    // Mostrar error temporal
    const errorDiv = document.createElement('div');
    errorDiv.className = 'comment-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>
        ${message}
    `;
    errorDiv.style.cssText = `
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

    commentInput.parentNode.insertBefore(errorDiv, commentInput.nextSibling);

    // Hacer scroll al error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

    showCommentSuccess(postId, message) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        // Remover mensajes anteriores
        const existingSuccess = commentsSection.querySelector('.comment-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'comment-success';
        successDiv.textContent = message;
        successDiv.style.cssText = `
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
            commentsContainer.insertBefore(successDiv, commentsContainer.firstChild);
        }

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }

    showMessage(message, type = 'success') {
        // Remover toasts anteriores
        const existingToasts = document.querySelectorAll('.comment-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
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

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Agrega esta función a la clase CommentSystem para debuggear las respuestas
logResponseDetails(response, data) {
    console.group('Comment API Response Details');
    console.log('HTTP Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response Data:', data);
    console.log('Has success property:', 'success' in data);
    console.log('Has comment property:', 'comment' in data);
    console.log('Comment structure:', data.comment);
    console.groupEnd();
}
}

// =====================================================================
// MAIN SCRIPT FOR INDEX PAGE - SISTEMA COMPLETO DE POSTS
// =====================================================================

class DevCommunity {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMorePosts = true;
        this.commentSystem = new CommentSystem(this);
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.bindEvents();
        this.loadPosts();
        this.setupMinibar();
        this.loadPopularTags();
    }

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

    showAuthNavigation() {
        const authActions = document.getElementById('authActions');
        const userNav = document.getElementById('userNav');
        
        if (authActions) authActions.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }

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

    async loadPosts() {
        if (this.isLoading || !this.hasMorePosts) return;
        
        this.isLoading = true;
        this.showLoading(true);

        try {
            const view = document.querySelector('.tab--active')?.dataset.view || 'latest';
            const sort = document.getElementById('sortSelect')?.value || 'new';
            
            const response = await fetch(`/api/posts?page=${this.currentPage}&view=${view}&sort=${sort}`);
            
            if (!response.ok) {
                // Si no hay endpoint de posts, mostrar estado vacío
                if (response.status === 404) {
                    this.posts = [];
                    this.renderPosts();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.posts && data.posts.length > 0) {
                if (this.currentPage === 1) {
                    this.posts = data.posts;
                } else {
                    this.posts = [...this.posts, ...data.posts];
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

        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Error loading posts. Please try again.');
            // En caso de error, mostrar estado vacío
            this.posts = [];
            this.renderPosts();
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    renderPosts() {
        const articlesContainer = document.getElementById('articles');
        
        if (!articlesContainer) return;

        if (this.posts.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-newspaper" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to create a post!</p>
                    ${this.currentUser ? '<button class="btn btn--primary" onclick="window.location.href=\'/PERFIL/createPost.html\'">Create Post</button>' : ''}
                </div>
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

        return `
            <article class="article-card" data-post-id="${postId}" style="opacity: 1; background: white;">
                <div class="article-card__inner">
                    <header class="article-card__header">
                        <img src="${profilePicture}" alt="${username}" class="article-card__avatar" onerror="this.src='/IMAGENES/default-avatar.png'">
                        <div class="article-card__user-info">
                            <span class="article-card__username">${username}</span>
                            <span class="article-card__date">${date}</span>
                        </div>
                        ${this.currentUser ? `
                            <button class="article-card__bookmark ${post.hasFavorited ? 'article-card__bookmark--active' : ''}" 
                                    onclick="devCommunity.toggleFavorite('${postId}')">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        ` : ''}
                    </header>

                    <div class="article-card__content">
                        <h2 class="article-card__title">
                            <a href="#" onclick="devCommunity.viewPost('${postId}'); return false;">${post.title || 'Untitled Post'}</a>
                        </h2>
                        
                        ${post.coverImage ? `
                            <div class="article-card__cover">
                                <img src="${post.coverImage}" alt="Cover image for ${post.title}" onerror="this.style.display='none'">
                            </div>
                        ` : ''}

                        ${post.tags && post.tags.length > 0 ? `
                            <div class="article-card__tags">
                                ${post.tags.map(tag => `
                                    <span class="tag">#${tag}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <footer class="article-card__footer">
                        <div class="article-card__reactions">
                            ${this.createReactionsHTML(post)}
                        </div>
                        
                        <div class="article-card__meta">
                            <span class="article-card__reading-time">${readingTime} min read</span>
                            <button class="article-card__comments-btn" onclick="devCommunity.commentSystem.toggleComments('${postId}')">
                                <i class="fas fa-comment"></i>
                                <span>${post.commentsCount || 0}</span>
                            </button>
                        </div>
                    </footer>

                    <!-- SECCIÓN DE COMENTARIOS -->
                    <div class="article-card__comments" id="comments-${postId}" style="display: none;">
                        <div class="comments-container" id="comments-container-${postId}">
                            <!-- Los comentarios se cargarán aquí -->
                        </div>
                        ${this.currentUser ? `
                            <div class="comment-form">
                                <textarea class="comment-input" id="comment-input-${postId}" 
                                          placeholder="Add to the discussion... (Ctrl+Enter to submit)"></textarea>
                                <button class="btn btn--primary btn--small" onclick="devCommunity.commentSystem.addComment('${postId}')">
                                    Submit Comment
                                </button>
                            </div>
                        ` : `
                            <div class="login-prompt">
                                <a href="/Login.html">Log in</a> to leave a comment
                            </div>
                        `}
                    </div>
                </div>
            </article>
        `;
    }

    createReactionsHTML(post) {
        const reactions = [
            { type: 'like', icon: '👍', label: 'Like' },
            { type: 'unicorn', icon: '🦄', label: 'Unicorn' },
            { type: 'exploding_head', icon: '🤯', label: 'Exploding Head' },
            { type: 'fire', icon: '🔥', label: 'Fire' },
            { type: 'heart', icon: '❤️', label: 'Heart' },
            { type: 'rocket', icon: '🚀', label: 'Rocket' }
        ];

        return reactions.map(reaction => {
            const count = post.reactionCounts?.[reaction.type] || 0;
            const isActive = post.hasReacted && post.userReaction === reaction.type;
            
            return `
                <button class="reaction-btn ${isActive ? 'reaction-btn--active' : ''}" 
                        onclick="devCommunity.addReaction('${post._id || post.id}', '${reaction.type}')"
                        title="${reaction.label}">
                    <span class="reaction-emoji">${reaction.icon}</span>
                    <span class="reaction-count">${count}</span>
                </button>
            `;
        }).join('');
    }

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

    viewPost(postId) {
        // Al hacer clic en el título, abrir los comentarios
        this.commentSystem.toggleComments(postId);
    }

    switchFeedView(view) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.toggle('tab--active', tab.dataset.view === view);
        });

        // Reset and reload posts
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.posts = [];
        this.loadPosts();
    }

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

    renderSearchResults(posts) {
        const articlesContainer = document.getElementById('articles');
        if (!articlesContainer) return;

        if (posts.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-search" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                    <h3>No posts found</h3>
                    <p>Try different search terms</p>
                </div>
            `;
            return;
        }

        articlesContainer.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
    }

    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 500 && !this.isLoading && this.hasMorePosts) {
            this.loadPosts();
        }
    }

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

    showError(message) {
        console.error('Error:', message);
    }

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

    async loadPopularTags() {
        // Ya se maneja en renderTags()
    }
}

// =====================================================================
// CSS ADICIONAL PARA COMENTARIOS
// =====================================================================

// En la función injectCommentCSS(), agrega estos estilos para el dropdown:
function injectCommentCSS() {
    if (!document.querySelector('#comment-system-css')) {
        const style = document.createElement('style');
        style.id = 'comment-system-css';
        style.textContent = `
/* Comment System Styles */
.comment {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 3px solid #3b49df;
}

.comment__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
}

.comment__content {
    flex: 1;
    min-width: 0;
}

.comment__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    gap: 12px;
}

.comment__user-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.comment__username {
    font-weight: 600;
    color: #242424;
    font-size: 14px;
}

.comment__badge {
    background: #3b49df;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
}

.comment__actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.comment__action-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s;
}

.comment__action-btn:hover {
    background: #e9ecef;
    color: #242424;
}

.comment__action-btn--danger:hover {
    background: #dc3545;
    color: white;
}

.comment__date {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
}

.comment__text {
    color: #242424;
    line-height: 1.5;
    font-size: 14px;
    margin-bottom: 8px;
    word-wrap: break-word;
}

.comment__edited {
    margin-top: 4px;
}

.comment__edited small {
    color: #666;
    font-size: 11px;
    font-style: italic;
}

.comment__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
}

.comment__like-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s;
}

.comment__like-btn:hover {
    background: #e9ecef;
    color: #dc3545;
}

.comment__like-btn--active {
    color: #dc3545;
}

.comment__like-count {
    font-size: 12px;
    font-weight: 500;
}

.comment-edit-form {
    margin-bottom: 8px;
}

.comment-edit-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    font-size: 14px;
    margin-bottom: 8px;
}

.comment-edit-input:focus {
    outline: none;
    border-color: #3b49df;
}

.comment-edit-actions {
    display: flex;
    gap: 8px;
}

.no-comments {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.no-comments i {
    margin-bottom: 12px;
}

.comments-error {
    text-align: center;
    padding: 20px;
    color: #666;
}

.comment-form {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
}

.comment-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 8px;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s;
}

.comment-input:focus {
    outline: none;
    border-color: #3b49df;
    box-shadow: 0 0 0 2px rgba(59, 73, 223, 0.1);
}

.login-prompt {
    text-align: center;
    padding: 20px;
    color: #666;
    background: #f8f9fa;
    border-radius: 4px;
    margin-top: 16px;
}

.login-prompt a {
    color: #3b49df;
    text-decoration: none;
    font-weight: 500;
}

.login-prompt a:hover {
    text-decoration: underline;
}

/* User Dropdown Styles */
.user-dropdown {
    position: absolute !important;
    top: 100% !important;
    right: 0 !important;
    background: white !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    min-width: 200px !important;
    z-index: 1000 !important;
    margin-top: 8px !important;
}

.user-dropdown[style*="display: none"] {
    display: none !important;
}

.user-dropdown[style*="display: block"] {
    display: block !important;
}

.user-menu {
    position: relative !important;
}

.user-avatar {
    cursor: pointer !important;
    transition: transform 0.2s !important;
}

.user-avatar:hover {
    transform: scale(1.05) !important;
}

/* Animaciones para comentarios */
.article-card__comments {
    transition: all 0.3s ease;
}

.comment {
    animation: commentSlideIn 0.3s ease;
}

@keyframes commentSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .comment__header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .comment__actions {
        align-self: flex-end;
    }
    
    .comment {
        padding: 12px;
    }
    
    .comment__avatar {
        width: 32px;
        height: 32px;
    }
    
    .user-dropdown {
        right: 10px !important;
        left: 10px !important;
        min-width: unset !important;
    }
}
`;
        document.head.appendChild(style);
    }
}

// =====================================================================
// INITIALIZATION SECTION
// =====================================================================

function init() {
    console.log('Initializing DEV Community with Comment System...');
    setupImageErrorHandlers();
    initUserDropdown();
    renderTags();
    initMinibar();
    injectCommentCSS(); // Inyectar CSS de comentarios
    
    // Inicializar la aplicación principal
    window.devCommunity = new DevCommunity();
    
    console.log('DEV Community with Comment System initialized successfully');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(init, 100);
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado. Inicializando dropdown...");
  initUserDropdown();
});

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

// Funciones globales para los event handlers del HTML
window.toggleComments = (postId) => window.devCommunity?.commentSystem.toggleComments(postId);
window.addReaction = (postId, reactionType) => window.devCommunity?.addReaction(postId, reactionType);
window.toggleFavorite = (postId) => window.devCommunity?.toggleFavorite(postId);
window.addComment = (postId) => window.devCommunity?.commentSystem.addComment(postId);
window.viewPost = (postId) => window.devCommunity?.viewPost(postId);