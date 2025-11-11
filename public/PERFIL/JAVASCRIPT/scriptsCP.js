        class CreatePost {
            constructor() {
                this.currentTags = [];
                this.maxTags = 4;
                this.init();
            }

            init() {
                this.bindEvents();
                this.checkAuthentication();
            }

            checkAuthentication() {
                fetch('/api/user')
                    .then(response => response.json())
                    .then(data => {
                        if (!data.user) {
                            window.location.href = '/';
                        }
                    })
                    .catch(error => {
                        console.error('Error checking authentication:', error);
                        window.location.href = '/';
                    });
            }

            bindEvents() {
                // Cover image
                document.getElementById('coverImageSection').addEventListener('click', () => {
                    document.getElementById('coverImageInput').click();
                });

                document.getElementById('coverImageInput').addEventListener('change', (e) => {
                    this.handleCoverImage(e.target.files[0]);
                });

                // Tags
                document.getElementById('postTags').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        this.addTag();
                    }
                });

                document.getElementById('postTags').addEventListener('blur', () => {
                    this.addTag();
                });

                // Toolbar buttons
                document.querySelectorAll('.toolbar-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleToolbarClick(e.target.closest('button'));
                    });
                });

                // Form actions
                document.getElementById('saveDraftBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.savePost(false);
                });

                document.getElementById('publishBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.savePost(true);
                });
            }

            handleCoverImage(file) {
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        this.showMessage('Please select an image file', 'error');
                        return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        this.showMessage('Image size must be less than 5MB', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('coverImagePreview');
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        document.querySelector('#coverImageSection i').style.display = 'none';
                        document.querySelector('#coverImageSection p').style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            }

            addTag() {
                const input = document.getElementById('postTags');
                const tagText = input.value.trim().toLowerCase();

                if (tagText && tagText.length > 0) {
                    if (this.currentTags.length >= this.maxTags) {
                        this.showMessage(`Maximum ${this.maxTags} tags allowed`, 'error');
                        return;
                    }

                    if (this.currentTags.includes(tagText)) {
                        this.showMessage('Tag already added', 'error');
                        return;
                    }

                    this.currentTags.push(tagText);
                    this.renderTags();
                    input.value = '';
                }
            }

            removeTag(tag) {
                this.currentTags = this.currentTags.filter(t => t !== tag);
                this.renderTags();
            }

            renderTags() {
                const container = document.getElementById('tagsContainer');
                container.innerHTML = '';

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

            handleToolbarClick(button) {
                const command = button.dataset.command;
                const value = button.dataset.value;
                
                document.getElementById('postContent').focus();
                
                try {
                    if (command === 'formatBlock' && value) {
                        document.execCommand(command, false, value);
                    } else {
                        document.execCommand(command, false, null);
                    }
                } catch (error) {
                    console.error('Error executing command:', error);
                }
            }

            async savePost(publish = false) {
                const title = document.getElementById('postTitle').value.trim();
                const content = document.getElementById('postContent').value.trim();
                const coverImage = document.getElementById('coverImageInput').files[0];

                if (!title) {
                    this.showMessage('Post title is required', 'error');
                    return;
                }

                if (!content) {
                    this.showMessage('Post content is required', 'error');
                    return;
                }

                if (title.length > 200) {
                    this.showMessage('Title must be less than 200 characters', 'error');
                    return;
                }

                const formData = new FormData();
                formData.append('title', title);
                formData.append('content', content);
                formData.append('published', publish);
                formData.append('tags', this.currentTags.join(','));

                if (coverImage) {
                    formData.append('coverImage', coverImage);
                }

                this.showLoading(true);
                this.hideMessages();

                try {
                    const response = await fetch('/api/posts', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok) {
                        this.showMessage(result.message, 'success');
                        
                        if (publish) {
                            setTimeout(() => {
                                window.location.href = '/index';
                            }, 1500);
                        }
                    } else {
                        this.showMessage(result.error || 'Error creating post', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    this.showMessage('Network error. Please try again.', 'error');
                } finally {
                    this.showLoading(false);
                }
            }

            showMessage(message, type) {
                const errorDiv = document.getElementById('errorMessage');
                const successDiv = document.getElementById('successMessage');

                if (type === 'error') {
                    errorDiv.textContent = message;
                    errorDiv.classList.remove('hidden');
                    successDiv.classList.add('hidden');
                } else {
                    successDiv.textContent = message;
                    successDiv.classList.remove('hidden');
                    errorDiv.classList.add('hidden');
                }

                if (type === 'success') {
                    setTimeout(() => {
                        successDiv.classList.add('hidden');
                    }, 5000);
                }
            }

            hideMessages() {
                document.getElementById('errorMessage').classList.add('hidden');
                document.getElementById('successMessage').classList.add('hidden');
            }

            showLoading(show) {
                const loading = document.getElementById('loading');
                const publishBtn = document.getElementById('publishBtn');
                const saveDraftBtn = document.getElementById('saveDraftBtn');

                if (show) {
                    loading.classList.remove('hidden');
                    publishBtn.disabled = true;
                    saveDraftBtn.disabled = true;
                } else {
                    loading.classList.add('hidden');
                    publishBtn.disabled = false;
                    saveDraftBtn.disabled = false;
                }
            }
        }

        const createPost = new CreatePost();