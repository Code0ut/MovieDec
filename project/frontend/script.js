const API_BASE_URL = 'http://localhost:8000';

// State Management
let state = {
    isAuthenticated: false,
    currentUser: null,
    token: null,
    allMovies: [],
    likedMovies: new Set(),
    currentView: 'all-movies',
    theme: 'dark'
};

// DOM Elements
const authView = document.getElementById('auth-view');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const tabBtns = document.querySelectorAll('.tab-btn');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name');
const searchInput = document.getElementById('search-input');
const genreFilter = document.getElementById('genre-filter');
const moviesGrid = document.getElementById('movies-grid');
const recommendationsContent = document.getElementById('recommendations-content');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkAuth();
    setupEventListeners();
});

// Check Authentication
function checkAuth() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('access_token');

    if (username && token) {
        state.isAuthenticated = true;
        state.currentUser = username;
        state.token = token;
        showMainApp();
    } else {
        showAuthView();
    }
}

// Show/Hide Views
function showAuthView() {
    authView.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authView.classList.add('hidden');
    mainApp.classList.remove('hidden');
    userNameDisplay.textContent = state.currentUser;
    loadMovies();
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    state.theme = savedTheme;
    applyTheme();
}

function applyTheme() {
    if (state.theme === 'light') {
        document.body.classList.add('light-mode');
        document.querySelector('.theme-icon').textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        document.querySelector('.theme-icon').textContent = '🌙';
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

// Event Listeners
function setupEventListeners() {
    // Auth tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const page = link.dataset.page;
            switchPage(page);
        });
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Search and filter
    searchInput.addEventListener('input', filterMovies);
    genreFilter.addEventListener('change', filterMovies);
}

// Auth Tab Switching
function switchAuthTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    loginForm.classList.remove('active');
    registerForm.classList.remove('active');

    if (tab === 'login') {
        loginForm.classList.add('active');
    } else {
        registerForm.classList.add('active');
    }

    hideMessage();
}

// Page Switching
function switchPage(pageName) {
    state.currentView = pageName;

    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageName}-page`).classList.add('active');

    if (pageName === 'recommendations') {
        loadRecommendations();
    }
}

// API Calls
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
            method: 'POST'
        });

        hideLoading();

        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => switchAuthTab('login'), 1500);
        } else {
            const error = await response.json();
            showMessage(error.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        hideLoading();
        showMessage('Network error. Please try again.', 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        showLoading();
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        hideLoading();

        if (response.ok) {
            const data = await response.json();
            state.isAuthenticated = true;
            state.currentUser = username;
            state.token = data.access_token;

            localStorage.setItem('username', username);
            localStorage.setItem('access_token', data.access_token);

            showMainApp();
        } else {
            const error = await response.json();
            showMessage(error.detail || 'Login failed', 'error');
        }
    } catch (error) {
        hideLoading();
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadMovies() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/movies`);

        if (response.ok) {
            state.allMovies = await response.json();
            populateGenreFilter();
            displayMovies(state.allMovies);
        } else {
            showToast('Failed to load movies');
        }
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Network error loading movies');
    }
}

async function toggleLike(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/like?user_name=${encodeURIComponent(state.currentUser)}&movie_id=${movieId}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();

            if (data.message.includes('liked')) {
                state.likedMovies.add(movieId);
                showToast('Movie liked! ❤️');
            } else {
                state.likedMovies.delete(movieId);
                showToast('Movie unliked');
            }

            // Update UI
            const heartBtn = document.querySelector(`[data-movie-id="${movieId}"]`);
            if (heartBtn) {
                heartBtn.textContent = state.likedMovies.has(movieId) ? '❤️' : '🤍';
                heartBtn.classList.toggle('liked');
            }
        }
    } catch (error) {
        showToast('Failed to update like status');
    }
}

async function loadRecommendations() {
    if (state.likedMovies.size === 0) {
        recommendationsContent.innerHTML = `
            <div class="empty-state">
                <h3>No Recommendations Yet</h3>
                <p>Like some movies to get personalized recommendations!</p>
            </div>
        `;
        return;
    }

    try {
        showLoading();
        recommendationsContent.innerHTML = '';

        for (const movieId of state.likedMovies) {
            const movie = state.allMovies.find(m => m.movie_id === movieId);
            if (!movie) continue;

            const response = await fetch(`${API_BASE_URL}/recommendations/${movieId}`);

            if (response.ok) {
                const recommendations = await response.json();

                if (recommendations.length > 0) {
                    const section = document.createElement('div');
                    section.className = 'recommendation-section';
                    section.innerHTML = `
                        <h3>Because you liked "${movie.movie_name}"</h3>
                        <div class="movies-grid">
                            ${recommendations.map(rec => createMovieCard(rec, true)).join('')}
                        </div>
                    `;
                    recommendationsContent.appendChild(section);
                }
            }
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Failed to load recommendations');
    }
}

// UI Functions
function populateGenreFilter() {
    const genres = [...new Set(state.allMovies.map(m => m.genre))].sort();
    genreFilter.innerHTML = '<option value="">All Genres</option>';
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

function filterMovies() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGenre = genreFilter.value;

    const filtered = state.allMovies.filter(movie => {
        const matchesSearch = movie.movie_name.toLowerCase().includes(searchTerm);
        const matchesGenre = !selectedGenre || movie.genre === selectedGenre;
        return matchesSearch && matchesGenre;
    });

    displayMovies(filtered);
}

function displayMovies(movies) {
    moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');

    // Add event listeners to like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const movieId = parseInt(btn.dataset.movieId);
            toggleLike(movieId);
        });
    });
}

function createMovieCard(movie, isRecommendation = false) {
    const isLiked = state.likedMovies.has(movie.movie_id);
    const likeCount = isRecommendation && movie.like_count ? `<span class="like-count">👍 ${movie.like_count}</span>` : '';

    return `
        <div class="movie-card">
            <h3>${movie.movie_name}</h3>
            <div class="movie-info">
                <span class="genre">${movie.genre}</span>
                <span class="rating">⭐ ${movie.ratings}</span>
            </div>
            ${likeCount}
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-movie-id="${movie.movie_id}">
                ${isLiked ? '❤️' : '🤍'}
            </button>
        </div>
    `;
}

function handleLogout() {
    state.isAuthenticated = false;
    state.currentUser = null;
    state.token = null;
    state.likedMovies.clear();

    localStorage.removeItem('username');
    localStorage.removeItem('access_token');

    loginForm.reset();
    registerForm.reset();

    showAuthView();
    showToast('Logged out successfully');
}

function showMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

function hideMessage() {
    authMessage.className = 'message';
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}