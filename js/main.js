// js/main.js

/**
 * Global State and Utilities
 */
const App = {
    state: {
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
        user: JSON.parse(localStorage.getItem('user')) || null,
        products: []
    },

    apiUrl: 'backend/api', // Relative path works for both Node server and PHP setup

    // Initialize App
    init: function () {
        this.updateCartCount();
        this.checkAuth();
        this.bindEvents();
    },

    checkAuth: function () {
        if (this.state.user) {
            // Update User Icon link
            const userLink = document.querySelector('a[href="login.html"]');
            if (userLink) {
                userLink.href = 'profile.html';
                userLink.innerHTML = '<i class="fas fa-user-check"></i>'; // Visual indicator
                userLink.title = "My Profile";
            }
        }
    },

    bindEvents: function () {
        // Logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },

    /**
     * Cart Management
     */
    addToCart: function (product, quantity = 1) {
        const existingItem = this.state.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            this.state.cart.push({
                ...product,
                quantity: parseInt(quantity)
            });
        }

        this.saveCart();
        this.showToast('Product added to cart');
    },

    removeFromCart: function (productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.saveCart();
    },

    updateCartItem: function (productId, quantity) {
        const item = this.state.cart.find(i => i.id === productId);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) this.removeFromCart(productId);
            else this.saveCart();
        }
    },

    saveCart: function () {
        localStorage.setItem('cart', JSON.stringify(this.state.cart));
        this.updateCartCount();
        // Dispatch event for other components
        window.dispatchEvent(new Event('cartUpdated'));
    },

    getCartTotal: function () {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateCartCount: function () {
        const count = this.state.cart.reduce((c, item) => c + item.quantity, 0);
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(el => el.textContent = count);
    },

    /**
     * Wishlist Management
     */
    toggleWishlist: function (productId) {
        const index = this.state.wishlist.indexOf(productId);
        if (index === -1) {
            this.state.wishlist.push(productId);
            this.showToast('Added to Wishlist');
        } else {
            this.state.wishlist.splice(index, 1);
            this.showToast('Removed from Wishlist');
        }
        this.saveWishlist();
        this.updateWishlistIcons();
    },

    saveWishlist: function () {
        localStorage.setItem('wishlist', JSON.stringify(this.state.wishlist));
    },

    isInWishlist: function (productId) {
        return this.state.wishlist.includes(productId);
    },

    updateWishlistIcons: function () {
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const id = parseInt(btn.dataset.id);
            if (this.isInWishlist(id)) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            }
        });
    },

    /**
     * Auth
     */
    login: function (user) {
        this.state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'profile.html';
    },

    logout: function () {
        this.state.user = null;
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    /**
     * UI Utilities
     */
    formatPrice: function (price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    },

    showToast: function (message, type = 'success') {
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createToastContainer: function () {
        const div = document.createElement('div');
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    },

    // Fetch Helper
    fetch: async function (endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiUrl}/${endpoint}`, options);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Fetch Error:', error);
            this.showToast(error.message, 'error');
            throw error;
        }
    },

    /**
     * Scroll Animations
     */
    initAnimations: function () {
        console.log('Initializing animations...');
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -20px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    App.initAnimations();
});
