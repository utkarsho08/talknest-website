const API_BASE_URL = 'https://talknest-website.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const pageLogic = {
        'login-form': handleLoginForm,
        'signup-form': handleSignupForm,
        'create-post-form': handleCreatePostForm,
        'create-topic-form': handleCreateTopicForm,
        'posts-container': handlePostsPage,
        'post-detail-container': handleSinglePostPage,
        'topics-container': handleTopicsPage,
        'profile-page': handleProfilePage
    };

    for (const id in pageLogic) {
        if (document.getElementById(id)) {
            pageLogic[id]();
            break;
        }
    }
});

function handleLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitAuthForm(`${API_BASE_URL}/api/users/login`, {
            email: form.email.value,
            password: form.password.value
        });
    });
}

function handleSignupForm() {
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitAuthForm(`${API_BASE_URL}/api/users/register`, {
            username: form.username.value,
            email: form.email.value,
            password: form.password.value
        });
    });
}

async function submitAuthForm(url, body) {
    const errorMessage = document.getElementById('error-message');
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Authentication failed');
        if (data.token) localStorage.setItem('token', data.token);
        window.location.href = data.token ? '/index.html' : '/login.html';
    } catch (error) {
        console.error('Auth error:', error);
        errorMessage.textContent = error.message;
    }
}

function handleCreatePostForm() {
    const form = document.getElementById('create-post-form');
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            topicName: form['post-topic'].value,
            title: form['post-title'].value,
            text: form['post-text'].value,
            link: form['post-link'].value
        };
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create post');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Error creating post:', error);
            document.getElementById('error-message').textContent = error.message;
        }
    });
}

function handleCreateTopicForm() {
    const form = document.getElementById('create-topic-form');
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: form['topic-name'].value,
        };
        try {
            const res = await fetch(`${API_BASE_URL}/api/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create topic');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Error creating topic:', error);
            document.getElementById('error-message').textContent = error.message;
        }
    });
}

function handlePostsPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const topicName = params.get('name');

    if (topicName) {
        const topicTitleElement = document.getElementById('topic-title');
        if (topicTitleElement) {
            topicTitleElement.textContent = `t/${topicName}`;
        }
        fetchTopicPosts(topicName);
    } else {
        fetchPosts();
    }
    setupCommonListeners(token);
}

function handleSinglePostPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    if (postId) fetchSinglePost(postId);

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const commentText = document.getElementById('comment-text').value;
            handleCommentSubmit(postId, commentText, null, token);
        });
    }
    document.getElementById('comments-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const parentCommentId = e.target.dataset.commentId;
            showReplyForm(parentCommentId, postId, token);
        }
    });
}

function handleTopicsPage() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
        return;
    }
    fetchTopics();
}

function handleProfilePage() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    const userId = getUserIdFromToken();
    if (userId) {
        fetchUserProfile(userId, token);
    } else {
        document.getElementById('profile-username').textContent = 'User ID not found.';
    }
}

function setupCommonListeners(token) {
    const postsContainer = document.getElementById('posts-container');
    const postDetailContainer = document.getElementById('post-detail-container');

    if (postsContainer) {
        postsContainer.addEventListener('click', (e) => {
            const likeButton = e.target.closest('.like-btn');
            const dislikeButton = e.target.closest('.dislike-btn');
            const editButton = e.target.closest('.edit-post-btn');
            const deleteButton = e.target.closest('.delete-post-btn');

            if (likeButton) {
                const postId = likeButton.dataset.id;
                handleLikeDislike('like', postId, token, likeButton);
            } else if (dislikeButton) {
                const postId = dislikeButton.dataset.id;
                handleLikeDislike('dislike', postId, token, dislikeButton);
            } else if (editButton) {
                const postId = editButton.dataset.id;
                handleEditPost(postId, token, editButton);
            } else if (deleteButton) {
                const postId = deleteButton.dataset.id;
                if (confirm('Are you sure you want to delete this post?')) {
                    deletePost(postId, token, deleteButton);
                }
            }
        });
    }

    if (postDetailContainer) {
        postDetailContainer.addEventListener('click', (e) => {
            const likeButton = e.target.closest('.like-btn');
            const dislikeButton = e.target.closest('.dislike-btn');
            const editButton = e.target.closest('.edit-post-btn');
            const deleteButton = e.target.closest('.delete-post-btn');

            if (likeButton) {
                const postId = likeButton.dataset.id;
                handleLikeDislike('like', postId, token, likeButton);
            } else if (dislikeButton) {
                const postId = dislikeButton.dataset.id;
                handleLikeDislike('dislike', postId, token, dislikeButton);
            } else if (editButton) {
                const postId = editButton.dataset.id;
                handleEditPost(postId, token, editButton);
            } else if (deleteButton) {
                const postId = deleteButton.dataset.id;
                if (confirm('Are you sure you want to delete this post?')) {
                    deletePost(postId, token, deleteButton);
                }
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '/login.html';
        });
    }
}

async function fetchPosts() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts.');
        const posts = await res.json();
        const container = document.getElementById('posts-container');
        const currentUserId = getUserIdFromToken();
        container.innerHTML = posts.length > 0 ?
            posts.map(post => renderPost(post, currentUserId)).join('') :
            '<p>No posts yet. Be the first!</p>';
    } catch (error) {
        console.error('Error fetching posts:', error);
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) postsContainer.innerHTML = `<p class="error">Failed to load posts: ${error.message}</p>`;
    }
}

async function fetchTopics() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/topics`);
        if (!res.ok) throw new Error('Failed to fetch topics.');
        const topics = await res.json();
        const container = document.getElementById('topics-container');
        container.innerHTML = topics.length > 0 ? topics.map(topic => `
            <div class="topic-item post"><div class="post-content">
                <h3><a href="/topics.html?name=${topic.name}">t/${topic.name}</a></h3>
                <p>${topic.description}</p>
            </div></div>`).join('') : '<p>No topics yet. Create one!</p>';
    } catch (error) {
        console.error('Error fetching topics:', error);
        const topicsContainer = document.getElementById('topics-container');
        if (topicsContainer) topicsContainer.innerHTML = `<p class="error">Failed to load topics: ${error.message}</p>`;
    }
}

async function fetchTopicPosts(topicName) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/topics/${topicName}/posts`);
        if (!res.ok) throw new Error('Failed to fetch topic posts.');
        const posts = await res.json();
        const container = document.getElementById('posts-container');
        const currentUserId = getUserIdFromToken();
        container.innerHTML = posts.length > 0 ?
            posts.map(post => renderPost(post, currentUserId)).join('') :
            '<p>No posts in this topic yet.</p>';
    } catch (error) {
        console.error('Error fetching topic posts:', error);
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) postsContainer.innerHTML = `<p class="error">Failed to load topic posts: ${error.message}</p>`;
    }
}

function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.id;
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}

async function fetchUserProfile(userId, token) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch user profile.');
        const profileData = await res.json();

        document.getElementById('profile-initials').textContent = profileData.user.username.charAt(0).toUpperCase();
        document.getElementById('profile-username').textContent = profileData.user.username;
        document.getElementById('profile-email').textContent = `Email: ${profileData.user.email}`;
        document.getElementById('profile-user-id').textContent = profileData.user._id;

        const userPostsContainer = document.getElementById('user-posts-container');
        if (userPostsContainer) {
            userPostsContainer.innerHTML = '';
            if (profileData.posts && profileData.posts.length > 0) {
                userPostsContainer.innerHTML = profileData.posts.map(post => renderPost(post, userId)).join('');
            } else {
                userPostsContainer.innerHTML = '<p class="empty-message">You have not created any posts yet.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        document.getElementById('profile-username').textContent = 'Profile Not Found';
        document.getElementById('user-posts-error').classList.remove('hidden');
    }
}

async function fetchSinglePost(postId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
        if (!res.ok) throw new Error('Failed to fetch post.');
        const post = await res.json();
        const currentUserId = getUserIdFromToken();

        const userLiked = post.likes.includes(currentUserId);
        const userDisliked = post.dislikes.includes(currentUserId);

        document.getElementById('post-detail-container').innerHTML = `
            <div class="post" data-post-id="${post._id}" style="margin-bottom: 0;">
                <div class="like-dislike-container">
                    <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                        <i class="material-icons">thumb_up</i>
                    </button>
                    <span class="like-count">${post.likes.length || 0}</span>
                    <button class="dislike-btn ${userDisliked ? 'disliked' : ''}" data-id="${post._id}">
                        <i class="material-icons">thumb_down</i>
                    </button>
                    <span class="dislike-count">${post.dislikes.length || 0}</span>
                </div>
                <div class="post-content">
                    <h2>${post.title}</h2>
                    ${post.subreddit ? `<a href="/topics.html?name=${post.subreddit.name}" class="topic-link">t/${post.subreddit.name}</a>` : ''} 
                    <p>${post.text || ''}</p>
                    ${post.link ? `<small><a href="${post.link}" target="_blank">${post.link}</a></small>` : ''}
                    <div class="post-meta"><span>Posted by ${post.author.username}</span></div>
                </div>
            </a>
        </div>`;
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '';
        if (post.comments && post.comments.length > 0) {
            commentsContainer.appendChild(renderCommentTree(post.comments));
        } else {
            commentsContainer.innerHTML = '<p>No comments yet.</p>';
        }
        setupCommonListeners(localStorage.getItem('token'));
    } catch (error) {
        console.error('Error fetching single post:', error);
        const postDetailContainer = document.getElementById('post-detail-container');
        if (postDetailContainer) postDetailContainer.innerHTML = `<p class="error">Failed to load post: ${error.message}</p>`;
    }
}

async function handleLikeDislike(type, postId, token, buttonElement) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/${type}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to ${type} post`);
        }
        const updatedPost = await res.json();

        const postElement = buttonElement.closest('.post');
        if (postElement) {
            const likeCountSpan = postElement.querySelector('.like-count');
            const dislikeCountSpan = postElement.querySelector('.dislike-count');
            const likeBtn = postElement.querySelector('.like-btn');
            const dislikeBtn = postElement.querySelector('.dislike-btn');

            if (likeCountSpan) likeCountSpan.textContent = updatedPost.likes;
            if (dislikeCountSpan) dislikeCountSpan.textContent = updatedPost.dislikes;

            if (likeBtn) {
                if (updatedPost.userLiked) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
            }
            if (dislikeBtn) {
                if (updatedPost.userDisliked) {
                    dislikeBtn.classList.add('disliked');
                } else {
                    dislikeBtn.classList.remove('disliked');
                }
            }
        }
    } catch (error) {
        console.error(`Error ${type}ing post:`, error);
        alert(`Error: ${error.message}`);
    }
}

async function handleCommentSubmit(postId, text, parentCommentId, token) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text, parentCommentId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to submit comment');
        fetchSinglePost(postId);
    } catch (error) {
        console.error('Error submitting comment:', error);
        document.getElementById('error-message').textContent = error.message;
    }
}

function renderPost(post, currentUserId) {
    const userLiked = post.likes.includes(currentUserId);
    const userDisliked = post.dislikes.includes(currentUserId);

    const isAuthor = post.author && post.author._id === currentUserId;

    const actionButtons = isAuthor ? `
        <div class="post-actions">
            <button class="edit-post-btn" data-id="${post._id}">Edit</button>
            <button class="delete-post-btn" data-id="${post._id}">Delete</button>
        </div>
    ` : '';


    return `
        <div class="post" data-post-id="${post._id}">
            <div class="like-dislike-container">
                <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                    <i class="material-icons">thumb_up</i>
                </button>
                <span class="like-count">${post.likes.length || 0}</span>
                <button class="dislike-btn ${userDisliked ? 'disliked' : ''}" data-id="${post._id}">
                    <i class="material-icons">thumb_down</i>
                </button>
                <span class="dislike-count">${post.dislikes.length || 0}</span>
            </div>
            <a href="/post.html?id=${post._id}" class="post-link">
                <div class="post-content">
                    <h2>${post.title}</h2>
                    ${post.subreddit ? `<a href="/topics.html?name=${post.subreddit.name}" class="topic-link">t/${post.subreddit.name}</a>` : ''} 
                    <p>${post.text || ''}</p>
                    ${post.link ? `<small><a href="${post.link}" target="_blank">${post.link}</a></small>` : ''}
                    <div class="post-meta">
                        ${post.subreddit ? `<a href="/topics.html?name=${post.subreddit.name}" class="topic-link">t/${post.subreddit.name}</a>` : ''} 
                        <span>Posted by ${post.author ? post.author.username : '[deleted]'}</span>
                    </div>
                </div>
            </a>
        </div>`;
}



function renderCommentTree(comments) {
    const container = document.createElement('div');
    comments.forEach(comment => {
        const el = document.createElement('div');
        el.classList.add('comment');
        el.setAttribute('id', `comment-${comment._id}`);
        el.innerHTML = `
            <p>${comment.text}</p>
            <div class="post-meta">
                <span>Comment by ${comment.author ? post.author.username : '[deleted]'}</span>
                <button class="reply-btn" data-comment-id="${comment._id}">Reply</button>
            </div>`;
        if (comment.children && comment.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.classList.add('comment-children');
            childrenContainer.appendChild(renderCommentTree(comment.children));
            el.appendChild(childrenContainer);
        }
        container.appendChild(el);
    });
    return container;
}

function showReplyForm(parentCommentId, postId, token) {
    const existingForm = document.getElementById('reply-form-container');
    if (existingForm) existingForm.remove();
    const parentCommentElement = document.getElementById(`comment-${parentCommentId}`);
    if (!parentCommentElement) {
        console.error('Parent comment element not found for reply form.');
        return;
    }
    const formContainer = document.createElement('div');
    formContainer.id = 'reply-form-container';
    formContainer.classList.add('reply-form');
    formContainer.innerHTML = `
        <form id="reply-form">
            <textarea id="reply-text" placeholder="Write a reply..." required></textarea>
            <button type="submit">Submit Reply</button>
        </form>`;
    parentCommentElement.appendChild(formContainer);
    document.getElementById('reply-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const replyText = document.getElementById('reply-text').value;
        handleCommentSubmit(postId, replyText, parentCommentId, token);
    });
}