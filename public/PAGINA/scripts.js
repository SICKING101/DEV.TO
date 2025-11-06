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


        // ===== AUTHENTICATION FUNCTIONS =====
        async function checkAuth() {
            try {
                const response = await fetch('/api/user');
                const data = await response.json();
                
                if (data.user) {
                    // User is authenticated
                    authActions.style.display = 'none';
                    userNav.style.display = 'flex';
                    
                    // Update user info
                    userAvatar.src = data.user.profilePicture;
                    sidebarAvatar.style.backgroundImage = `url(${data.user.profilePicture})`;
                    sidebarUsername.textContent = data.user.username;
                    sidebarMeta.textContent = 'Welcome back!';
                } else {
                    // User is not authenticated
                    authActions.style.display = 'flex';
                    userNav.style.display = 'none';
                }
            } catch (error) {
                console.error('Error checking auth:', error);
            }
        }

        // ===== USER DROPDOWN FUNCTIONS =====
        userAvatar.addEventListener('click', (e) => {
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            userDropdown.style.display = 'none';
        });

        // ===== TAGS FUNCTIONS =====
        function renderTags() {
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
                searchInput.value = tag;
                doSearch();
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
                        btn.textContent = '❤️ ' + (incrementLike(id));
                    } else {
                        alert('Open comments modal (simulated)');
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
                    if (sort === 'popular') data.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                    else data.sort((a, b) => b.id - a.id);
                    resolve(data);
                }, 700);
            });
        }

        async function loadFeed() {
            loadingEl.style.display = 'block';
            const sort = sortSelect.value;
            const data = await fetchArticles({ sort });
            loadingEl.style.display = 'none';
            renderFeed(data);
        }

        // ===== SEARCH FUNCTION =====
        function doSearch() {
            const q = (searchInput.value || '').trim().toLowerCase();
            if (!q) {
                loadFeed();
                return;
            }
            const filtered = mockArticles.filter(a => {
                const inText = (a.title + ' ' + a.excerpt + ' ' + a.author).toLowerCase().includes(q);
                const inTags = a.tags.some(t => t.toLowerCase().includes(q.replace('#', '')));
                return inText || inTags;
            });
            renderFeed(filtered);
        }

        // ===== EVENT LISTENERS =====
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        sortSelect.addEventListener('change', loadFeed);

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('tab--active'));
                tab.classList.add('tab--active');
                const view = tab.dataset.view;
                if (view === 'top') {
                    sortSelect.value = 'popular';
                } else {
                    sortSelect.value = 'new';
                }
                loadFeed();
            });
        });

        // Mobile menu toggle
        menuToggle.addEventListener('click', () => {
            leftbar.classList.toggle('open');
        });

        // ===== INITIALIZATION =====
        checkAuth();
        renderTags();
        loadFeed();
        initMinibar();