// ===== MOCK DATA =====
const mockArticles = [
    {
        id: 1,
        title: 'Join the AI Agents Intensive Course Writing Challenge with Google and Kaggle!',
        author: 'Jess Lee',
        date: 'for The DEV Team • Oct 31',
        readTime: '3 min read',
        tags: ['googleak', 'challenge', 'kaggle', 'machinelearning', 'ai'],
        excerpt: 'Join the AI Agents Intensive Course Writing Challenge with Google and Kaggle!',
        likes: 85,
        comments: 1
    },
    {
        id: 2,
        title: 'Hacktoberfest: Contribution Chronicles',
        author: 'DEV Community',
        date: 'Oct 30',
        readTime: '5 min read',
        tags: ['hacktoberfest', 'opensource', 'github'],
        excerpt: 'Share your Hacktoberfest journey and contributions',
        likes: 42,
        comments: 3
    },
    {
        id: 3,
        title: 'Building Modern Web Applications with React and Node.js',
        author: 'Alex Johnson',
        date: 'Nov 5',
        readTime: '7 min read',
        tags: ['react', 'nodejs', 'javascript', 'webdev'],
        excerpt: 'Learn how to build scalable web applications using React and Node.js',
        likes: 156,
        comments: 12
    }
];

const popularTags = ['javascript', 'webdev', 'python', 'devops', 'react', 'nodejs', 'ai', 'machinelearning'];

// ===== DOM ELEMENTS =====
const articlesEl = document.getElementById('articles');
const loadingEl = document.getElementById('loading');
const popularTagsEl = document.getElementById('popularTags');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const tabs = document.querySelectorAll('.tab');
const authActions = document.getElementById('authActions');
const userNav = document.getElementById('userNav');
const userAvatar = document.getElementById('userAvatar');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarMeta = document.getElementById('sidebarMeta');
const userDropdown = document.getElementById('userDropdown');
const menuToggle = document.getElementById('menuToggle');
const leftbar = document.getElementById('leftbar');
const minibar = document.getElementById('minibar');

// ===== MINIBAR FUNCTIONALITY =====
function initMinibar() {
    const minibarItems = document.querySelectorAll('.minibar__item');
    
    minibarItems.forEach(item => {
        const link = item.querySelector('.minibar__link');
        const preview = item.querySelector('.minibar__preview');
        
        link.addEventListener('mouseenter', () => {
            // Hide all other previews
            minibarItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('minibar__item--preview');
                }
            });
            
            // Show this preview
            item.classList.add('minibar__item--preview');
        });
        
        item.addEventListener('mouseleave', () => {
            item.classList.remove('minibar__item--preview');
        });
    });
}

// ===== IMAGE ERROR HANDLING =====
function handleImageError(img) {
    console.warn('Failed to load profile image, using default');
    img.src = '/IMAGENES/default-avatar.png';
    img.alt = 'Default Avatar';
}

function setupImageErrorHandlers() {
    // Add error handler for user avatar
    userAvatar.addEventListener('error', () => handleImageError(userAvatar));
    
    // Add error handler for sidebar avatar
    const sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    if (sidebarAvatarImg) {
        sidebarAvatarImg.addEventListener('error', () => handleImageError(sidebarAvatarImg));
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
async function checkAuth() {
    try {
        console.log('Checking authentication status...');
        
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include', // Important for session cookies
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Auth response:', data);
        
        if (data.user && data.user.id) {
            // User is authenticated
            showAuthenticatedState(data.user);
        } else {
            // User is not authenticated
            showUnauthenticatedState();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        // Fallback to logged out state on error
        showUnauthenticatedState();
    }
}

function showAuthenticatedState(user) {
    console.log('Showing authenticated state for user:', user);
    
    // Hide login buttons, show user navigation
    if (authActions) authActions.style.display = 'none';
    if (userNav) userNav.style.display = 'flex';
    
    // Update user info with proper fallbacks
    const profilePic = user.profilePicture || '/IMAGENES/default-avatar.png';
    const username = user.username || 'User';
    const bio = user.bio || 'Welcome back!';
    
    // Update header user avatar
    if (userAvatar) {
        userAvatar.src = profilePic;
        userAvatar.alt = username;
        userAvatar.onerror = () => handleImageError(userAvatar);
    }
    
    // Update sidebar user info
    if (sidebarUsername) sidebarUsername.textContent = username;
    if (sidebarMeta) sidebarMeta.textContent = bio;
    
    // Update sidebar avatar
    updateSidebarAvatar(profilePic, username);
}

function showUnauthenticatedState() {
    console.log('Showing unauthenticated state');
    
    // Show login buttons, hide user navigation
    if (authActions) authActions.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
    
    // Reset to default state
    resetUserInfo();
}

function resetUserInfo() {
    const defaultAvatar = '/IMAGENES/default-avatar.png';
    
    // Reset header avatar
    if (userAvatar) {
        userAvatar.src = defaultAvatar;
        userAvatar.alt = 'Default Avatar';
    }
    
    // Reset sidebar info
    if (sidebarUsername) sidebarUsername.textContent = 'Welcome';
    if (sidebarMeta) sidebarMeta.textContent = 'Explore the latest in development';
    
    // Reset sidebar avatar
    updateSidebarAvatar(defaultAvatar, 'Default Avatar');
}

function updateSidebarAvatar(profilePic, username) {
    // Check if sidebar avatar exists as img element
    let sidebarAvatarImg = document.getElementById('sidebarAvatarImg');
    
    if (!sidebarAvatarImg && sidebarAvatar) {
        // Create img element if it doesn't exist
        sidebarAvatarImg = document.createElement('img');
        sidebarAvatarImg.id = 'sidebarAvatarImg';
        sidebarAvatarImg.className = 'profilecard__avatar-img';
        sidebarAvatarImg.alt = username;
        sidebarAvatar.appendChild(sidebarAvatarImg);
    }
    
    if (sidebarAvatarImg) {
        sidebarAvatarImg.src = profilePic;
        sidebarAvatarImg.alt = username;
        sidebarAvatarImg.onerror = () => handleImageError(sidebarAvatarImg);
    }
}

// ===== USER DROPDOWN FUNCTIONS =====
function initUserDropdown() {
    if (userAvatar) {
        userAvatar.addEventListener('click', (e) => {
            if (userDropdown) {
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            }
            e.stopPropagation();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (userDropdown) {
            userDropdown.style.display = 'none';
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    if (userDropdown) {
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// ===== TAGS FUNCTIONS =====
function renderTags() {
    if (!popularTagsEl) return;
    
    popularTagsEl.innerHTML = '';
    popularTags.forEach(tag => {
        const li = document.createElement('li');
        li.className = 'taglist__item';
        li.innerHTML = `<a href="#" class="taglist__link" data-tag="${tag}">#${tag}</a>`;
        popularTagsEl.appendChild(li);
    });

    // Add click handlers for tags
    popularTagsEl.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const tag = a.dataset.tag;
        if (searchInput) {
            searchInput.value = tag;
            doSearch();
        }
    });
}

// ===== ARTICLE FUNCTIONS =====
function articleCard(article) {
    const articleEl = document.createElement('article');
    articleEl.className = 'article';
    articleEl.innerHTML = `
        <header class="article__header">
            <div class="article__avatar"></div>
            <div>
                <div class="article__author">${article.author}</div>
                <div class="article__date">${article.date}</div>
            </div>
        </header>
        <h3 class="article__title">${article.title}</h3>
        <div class="article__tags">
            ${article.tags.map(t => `<span class="article__tag">#${t}</span>`).join('')}
        </div>
        <footer class="article__footer">
            <div class="reactions">
                <button class="reaction" data-action="like" data-id="${article.id}">❤️ ${article.likes}</button>
                <button class="reaction" data-action="comment" data-id="${article.id}">💬 ${article.comments}</button>
            </div>
            <div class="meta-right">${article.readTime}</div>
        </footer>
    `;
    return articleEl;
}

function renderFeed(list) {
    if (!articlesEl) return;
    
    articlesEl.innerHTML = '';
    if (!list.length) {
        articlesEl.innerHTML = '<div class="article">No articles found.</div>';
        return;
    }
    
    list.forEach(a => {
        articlesEl.appendChild(articleCard(a));
    });

    // Add reaction handlers
    articlesEl.querySelectorAll('.reaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id, 10);
            const action = btn.dataset.action;
            if (action === 'like') {
                const newLikes = incrementLike(id);
                btn.textContent = '❤️ ' + newLikes;
            } else {
                // Simulate opening comments
                const article = mockArticles.find(x => x.id === id);
                if (article) {
                    alert(`Opening comments for: "${article.title}"`);
                }
            }
        });
    });
}

function incrementLike(id) {
    const art = mockArticles.find(x => x.id === id);
    if (!art) return 0;
    art.likes = (art.likes || 0) + 1;
    return art.likes;
}

// ===== DATA FETCHING FUNCTIONS =====
function fetchArticles({ sort = 'new' } = {}) {
    return new Promise(resolve => {
        setTimeout(() => {
            let data = [...mockArticles];
            if (sort === 'popular') {
                data.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            } else {
                data.sort((a, b) => b.id - a.id);
            }
            resolve(data);
        }, 500); // Reduced loading time for better UX
    });
}

async function loadFeed() {
    if (!loadingEl || !articlesEl) return;
    
    loadingEl.style.display = 'block';
    articlesEl.style.opacity = '0.5';
    
    const sort = sortSelect ? sortSelect.value : 'new';
    const data = await fetchArticles({ sort });
    
    loadingEl.style.display = 'none';
    articlesEl.style.opacity = '1';
    renderFeed(data);
}

// ===== SEARCH FUNCTION =====
function doSearch() {
    const q = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    if (!q) {
        loadFeed();
        return;
    }
    
    const filtered = mockArticles.filter(a => {
        const searchText = (a.title + ' ' + a.excerpt + ' ' + a.author).toLowerCase();
        const inText = searchText.includes(q);
        const inTags = a.tags.some(t => t.toLowerCase().includes(q.replace('#', '')));
        return inText || inTags;
    });
    
    renderFeed(filtered);
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
        
        // Add debounced search
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(doSearch, 300);
        });
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', loadFeed);
    }
    
    // Tab switching
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('tab--active'));
                tab.classList.add('tab--active');
                const view = tab.dataset.view;
                if (sortSelect) {
                    sortSelect.value = view === 'top' ? 'popular' : 'new';
                }
                loadFeed();
            });
        });
    }
    
    // Mobile menu toggle
    if (menuToggle && leftbar) {
        menuToggle.addEventListener('click', () => {
            leftbar.classList.toggle('open');
        });
    }
    
    // Create post button
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            // Check if user is authenticated
            if (userNav.style.display === 'flex') {
                window.location.href = '/createPost';
            } else {
                window.location.href = '/Login.html';
            }
        });
    }
}

// ===== DEBUGGING FUNCTIONS =====
async function debugAuth() {
    try {
        console.log('=== AUTH DEBUG ===');
        const response = await fetch('/api/user', { 
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('User data:', data);
        console.log('=== END DEBUG ===');
        return data;
    } catch (error) {
        console.error('Debug error:', error);
        return null;
    }
}

// ===== INITIALIZATION =====
function init() {
    console.log('Initializing DEV Community...');
    
    // Setup all functionality
    setupImageErrorHandlers();
    initUserDropdown();
    renderTags();
    setupEventListeners();
    initMinibar();
    
    // Load initial content
    loadFeed();
    
    // Check authentication status
    checkAuth();
    
    // Re-check auth state periodically (optional)
    setInterval(checkAuth, 60000); // Every 60 seconds
    
    console.log('DEV Community initialized successfully');
}

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure DOM is fully ready
    setTimeout(init, 100);
});

// Export for debugging (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debugAuth, checkAuth };
}