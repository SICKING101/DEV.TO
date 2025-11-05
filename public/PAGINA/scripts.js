// Mock data
    const mockArticles = [
      {
        id: 1,
        title: 'Join the AI Agents Intensive Course Writing Challenge with Google and Kaggle!',
        author: 'Jess Lee',
        date: 'for The DEV Team • Oct 31',
        readTime: '2 min read',
        tags: ['googleak', 'challenge', 'kaggle', 'machinelearning', 'ai'],
        excerpt: 'Join the AI Agents Intensive Course Writing Challenge with Google and Kaggle!',
        likes: 84
      }
    ];

    const popularTags = ['javascript', 'webdev', 'python', 'devops', 'react', 'nodejs', 'ai', 'machinelearning'];

    // DOM Elements
    const articlesEl = document.getElementById('articles');
    const loadingEl = document.getElementById('loading');
    const popularTagsEl = document.getElementById('popularTags');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const tabs = document.querySelectorAll('.tab');

    // Render popular tags
    function renderTags() {
      popularTagsEl.innerHTML = '';
      popularTags.forEach(tag => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-tag="${tag}">#${tag}</a>`;
        popularTagsEl.appendChild(li);
      });

      // Tag click handler
      popularTagsEl.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const tag = a.dataset.tag;
        searchInput.value = tag;
        doSearch();
      });
    }

    // Create article card
    function articleCard(article) {
      const div = document.createElement('div');
      div.className = 'article';
      div.innerHTML = `
        <div class="article__header">
          <div class="article__avatar"></div>
          <div>
            <div class="article__author">${article.author}</div>
            <div class="article__date">${article.date}</div>
          </div>
        </div>
        <h3 class="article__title">${article.title}</h3>
        <div class="article__tags">
          ${article.tags.map(t => `<span class="article__tag">#${t}</span>`).join('')}
        </div>
        <div class="article__footer">
          <div class="reactions">
            <button class="reaction" data-action="like" data-id="${article.id}">❤️ ${article.likes}</button>
            <button class="reaction" data-action="comment" data-id="${article.id}">💬 Add Comment</button>
          </div>
          <div class="meta-right">${article.readTime}</div>
        </div>
      `;
      return div;
    }

    // Render articles
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

    // Increment like count
    function incrementLike(id) {
      const art = mockArticles.find(x => x.id === id);
      if (!art) return 0;
      art.likes = (art.likes || 0) + 1;
      return art.likes;
    }

    // Fetch articles (simulated)
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

    // Search function
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

    // Load feed
    async function loadFeed() {
      loadingEl.style.display = 'block';
      const sort = sortSelect.value;
      const data = await fetchArticles({ sort });
      loadingEl.style.display = 'none';
      renderFeed(data);
    }

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

    // Event listeners
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
    sortSelect.addEventListener('change', loadFeed);

    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const leftbar = document.getElementById('leftbar');
    menuToggle.addEventListener('click', () => {
      leftbar.classList.toggle('open');
    });

    // Initialize
    renderTags();
    loadFeed();