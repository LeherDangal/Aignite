

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    profile: document.getElementById('profile-screen'),
    dietary: document.getElementById('dietary-screen'),
    allergies: document.getElementById('allergies-screen'),
    habits: document.getElementById('habits-screen'),
    dashboard: document.getElementById('dashboard')
};

// Current user data
let currentUser = {
    name: '',
    age: '',
    sex: '',
    state: '',
    city: '',
    pincode: '',
    dietaryRestrictions: [],
    allergies: [],
    habits: '',
    cuisinePref: [],
    searchHistory: [],
    savedItems: []
};

// Initialize Particles.js
document.addEventListener('DOMContentLoaded', () => {
    particlesJS.load('particles-background', 'js/particles-config.json', function() {
        console.log('Particles.js loaded');
    });

    // Load user data if exists
    loadUserData();

    // Initialize AI chat helper
    initAIChatHelper();

    // Initialize menu toggle for mobile
    initMenuToggle();

    // Add event listeners for tab switching in settings
    initSettingsTabs();

    // Add event listeners for view options in saved items
    initSavedItemsView();

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});

// Navigation functions
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// Form submissions
document.getElementById('welcome-next').addEventListener('click', () => {
    showScreen('profile');
});

document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.name = document.getElementById('name').value;
    currentUser.age = document.getElementById('age').value;
    currentUser.sex = document.getElementById('sex').value;
    currentUser.state = document.getElementById('state').value;
    currentUser.city = document.getElementById('city').value;
    currentUser.pincode = document.getElementById('pincode').value;
    saveUserData();
    showScreen('dietary');
    updateProgressBar(2);
});

document.getElementById('dietary-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="dietary"]:checked');
    currentUser.dietaryRestrictions = Array.from(checkboxes).map(cb => cb.value);
    const otherDietary = document.getElementById('other-dietary').value;
    if (otherDietary) {
        currentUser.dietaryRestrictions.push(otherDietary);
    }
    saveUserData();
    showScreen('allergies');
    updateProgressBar(3);
});

document.getElementById('allergies-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="allergies"]:checked');
    currentUser.allergies = Array.from(checkboxes).map(cb => cb.value);
    const otherAllergies = document.getElementById('other-allergies').value;
    if (otherAllergies) {
        currentUser.allergies.push(otherAllergies);
    }
    saveUserData();
    showScreen('habits');
    updateProgressBar(4);
});

document.getElementById('habits-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.habits = document.querySelector('input[name="habits"]:checked').value;
    const cuisinePref = document.getElementById('cuisine-pref').value;
    currentUser.cuisinePref = cuisinePref.split(',').map(item => item.trim()).filter(item => item);
    saveUserData();
    initializeDashboard();
    showScreen('dashboard');
});

// Dashboard functionality
function initializeDashboard() {
    // Update profile info
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('location-summary').textContent = `${currentUser.city}, ${currentUser.state}`;

    // Load search history
    renderSearchHistory();
    
    // Load saved items
    renderSavedItems();
    
    // Set up navigation
    setupDashboardNavigation();
}

function setupDashboardNavigation() {
    const navItems = document.querySelectorAll('.sidebar nav ul li');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            const sectionId = item.getAttribute('data-section') + '-section';
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                    document.getElementById('content-title').textContent = 
                        section.querySelector('h2').textContent;
                }
            });
        });
    });
}

// Search functionality
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('food-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

async function performSearch() {
    const query = document.getElementById('food-search').value.trim();
    if (!query) return;

    // Show loading state
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Finding the best options for you...</p>
        </div>
    `;

    // Add to search history
    if (!currentUser.searchHistory.includes(query)) {
        currentUser.searchHistory.unshift(query);
        if (currentUser.searchHistory.length > 10) {
            currentUser.searchHistory.pop();
        }
        saveUserData();
        renderSearchHistory();
    }

    try {
        // Get recommendations from AI agents
        const recommendations = await getRecommendations(query, currentUser);
        
        // Filter by platform if selected
        const platform = document.getElementById('platform-filter').value;
        let filteredResults = platform === 'all' 
            ? recommendations 
            : recommendations.filter(item => item.platform === platform);

        // Sort results
        const sortBy = document.getElementById('sort-filter').value;
        filteredResults = sortRecommendations(filteredResults, sortBy);

        // Display results
        renderSearchResults(filteredResults);
    } catch (error) {
        console.error('Search failed:', error);
        searchResults.innerHTML = `
            <div class="error-message">
                <p>Sorry, we couldn't find any results. Please try a different search term.</p>
            </div>
        `;
    }
}

// ... (rest of the JavaScript code remains similar to the original, 
// but updated to work with the new UI elements and classes)

// Helper functions
function updateProgressBar(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((stepElement, index) => {
        if (index + 1 < step) {
            stepElement.classList.add('completed');
            stepElement.classList.remove('active');
        } else if (index + 1 === step) {
            stepElement.classList.add('active');
            stepElement.classList.remove('completed');
        } else {
            stepElement.classList.remove('active', 'completed');
        }
    });
}

function initAIChatHelper() {
    const chatHelper = document.querySelector('.ai-chat-helper');
    const toggleBtn = document.querySelector('.ai-helper-toggle');
    const closeBtn = document.querySelector('.close-chat');

    toggleBtn.addEventListener('click', () => {
        chatHelper.classList.toggle('active');
    });

    closeBtn.addEventListener('click', () => {
        chatHelper.classList.remove('active');
    });

    // Send message functionality
    const chatInput = document.querySelector('.chat-input input');
    const sendBtn = document.querySelector('.send-btn');

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            chatInput.value = '';
            // Simulate AI response
            setTimeout(() => {
                addAIMessage("I'm your FoodAI assistant. In a real implementation, I would respond intelligently to your message about: " + message);
            }, 1000);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addUserMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAIMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function initMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

function initSettingsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('[data-tab-content]');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('data-tab-content') === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function initSavedItemsView() {
    const viewOptions = document.querySelectorAll('.view-option');
    const savedItemsContainer = document.getElementById('saved-items');

    viewOptions.forEach(option => {
        option.addEventListener('click', () => {
            const viewType = option.getAttribute('data-view');
            
            // Update active view option
            viewOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Change view type
            savedItemsContainer.className = 'saved-items ' + viewType + '-view';
        });
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}
// Enhanced FoodAI Main Application Script
class FoodAIApp {
    constructor() {
      // DOM Elements
      this.screens = {
        welcome: document.getElementById('welcome-screen'),
        profile: document.getElementById('profile-screen'),
        dietary: document.getElementById('dietary-screen'),
        allergies: document.getElementById('allergies-screen'),
        habits: document.getElementById('habits-screen'),
        dashboard: document.getElementById('dashboard')
      };
  
      // Form elements
      this.forms = {
        profile: document.getElementById('profile-form'),
        dietary: document.getElementById('dietary-form'),
        allergies: document.getElementById('allergies-form'),
        habits: document.getElementById('habits-form'),
        feedback: document.getElementById('feedback-form')
      };
  
      // Search elements
      this.searchElements = {
        input: document.getElementById('food-search'),
        button: document.getElementById('search-btn'),
        results: document.getElementById('search-results'),
        platformFilter: document.getElementById('platform-filter'),
        sortFilter: document.getElementById('sort-filter')
      };
  
      // Dashboard elements
      this.dashboardElements = {
        profileName: document.getElementById('profile-name'),
        locationSummary: document.getElementById('location-summary'),
        historyItems: document.getElementById('history-items'),
        savedItems: document.getElementById('saved-items')
      };
  
      // Modal elements
      this.modals = {
        product: document.getElementById('product-modal'),
        feedback: document.getElementById('feedback-modal'),
        closeButtons: document.querySelectorAll('.close-modal')
      };
  
      // Current user data
      this.currentUser = this.loadUserData() || {
        name: '',
        age: '',
        sex: '',
        state: '',
        city: '',
        pincode: '',
        dietaryRestrictions: [],
        allergies: [],
        habits: '',
        cuisinePref: [],
        searchHistory: [],
        savedItems: []
      };
  
      // Initialize the app
      this.init();
    }
  
    init() {
      // Initialize event listeners
      this.initEventListeners();
      
      // Initialize UI components
      this.initUIComponents();
      
      // Show appropriate screen based on user data
      if (this.currentUser.name) {
        this.initializeDashboard();
        this.showScreen('dashboard');
      } else {
        this.showScreen('welcome');
      }
    }
  
    initEventListeners() {
      // Navigation
      document.getElementById('welcome-next').addEventListener('click', () => this.showScreen('profile'));
      
      // Form submissions
      this.forms.profile.addEventListener('submit', (e) => this.handleProfileForm(e));
      this.forms.dietary.addEventListener('submit', (e) => this.handleDietaryForm(e));
      this.forms.allergies.addEventListener('submit', (e) => this.handleAllergiesForm(e));
      this.forms.habits.addEventListener('submit', (e) => this.handleHabitsForm(e));
      this.forms.feedback.addEventListener('submit', (e) => this.handleFeedbackForm(e));
      
      // Search functionality
      this.searchElements.button.addEventListener('click', () => this.performSearch());
      this.searchElements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
      
      // Modal close buttons
      this.modals.closeButtons.forEach(btn => {
        btn.addEventListener('click', () => this.closeAllModals());
      });
      
      // Window click to close modals
      window.addEventListener('click', (e) => {
        if (e.target === this.modals.product || e.target === this.modals.feedback) {
          this.closeAllModals();
        }
      });
    }
  
    initUIComponents() {
      // Initialize particles.js background
      if (typeof particlesJS !== 'undefined') {
        particlesJS.load('particles-background', 'js/particles-config.json');
      }
      
      // Initialize AI chat helper
      this.initAIChatHelper();
      
      // Initialize responsive menu toggle
      this.initMenuToggle();
      
      // Initialize settings tabs
      this.initSettingsTabs();
      
      // Initialize saved items view toggle
      this.initSavedItemsView();
    }
  
    // Screen navigation
    showScreen(screenId) {
      Object.values(this.screens).forEach(screen => {
        screen.classList.remove('active');
      });
      this.screens[screenId].classList.add('active');
      window.scrollTo(0, 0);
    }
  
    // Form handlers
    handleProfileForm(e) {
      e.preventDefault();
      this.currentUser = {
        ...this.currentUser,
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        sex: document.getElementById('sex').value,
        state: document.getElementById('state').value,
        city: document.getElementById('city').value,
        pincode: document.getElementById('pincode').value
      };
      this.saveUserData();
      this.showScreen('dietary');
      this.updateProgressBar(2);
    }
  
    handleDietaryForm(e) {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('input[name="dietary"]:checked');
      this.currentUser.dietaryRestrictions = Array.from(checkboxes).map(cb => cb.value);
      const otherDietary = document.getElementById('other-dietary').value;
      if (otherDietary) this.currentUser.dietaryRestrictions.push(otherDietary);
      this.saveUserData();
      this.showScreen('allergies');
      this.updateProgressBar(3);
    }
  
    handleAllergiesForm(e) {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('input[name="allergies"]:checked');
      this.currentUser.allergies = Array.from(checkboxes).map(cb => cb.value);
      const otherAllergies = document.getElementById('other-allergies').value;
      if (otherAllergies) this.currentUser.allergies.push(otherAllergies);
      this.saveUserData();
      this.showScreen('habits');
      this.updateProgressBar(4);
    }
  
    handleHabitsForm(e) {
      e.preventDefault();
      this.currentUser = {
        ...this.currentUser,
        habits: document.querySelector('input[name="habits"]:checked').value,
        cuisinePref: document.getElementById('cuisine-pref').value
          .split(',')
          .map(item => item.trim())
          .filter(item => item)
      };
      this.saveUserData();
      this.initializeDashboard();
      this.showScreen('dashboard');
    }
  
    handleFeedbackForm(e) {
      e.preventDefault();
      const rating = document.querySelector('input[name="rating"]:checked').value;
      const comments = document.getElementById('feedback-comments').value;
      
      // In a real app, you would send this to your backend
      console.log('Feedback submitted:', {
        itemId: document.getElementById('feedback-item-id').value,
        rating,
        comments
      });
      
      alert('Thank you for your feedback!');
      this.closeAllModals();
      this.forms.feedback.reset();
    }
  
    // Dashboard functions
    initializeDashboard() {
      this.dashboardElements.profileName.textContent = this.currentUser.name;
      this.dashboardElements.locationSummary.textContent = 
        `${this.currentUser.city}, ${this.currentUser.state}`;
      
      this.renderSearchHistory();
      this.renderSavedItems();
      this.setupDashboardNavigation();
    }
  
    setupDashboardNavigation() {
      const navItems = document.querySelectorAll('.sidebar nav ul li');
      const contentSections = document.querySelectorAll('.content-section');
  
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          navItems.forEach(navItem => navItem.classList.remove('active'));
          item.classList.add('active');
          
          const sectionId = `${item.getAttribute('data-section')}-section`;
          contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
              section.classList.add('active');
              document.getElementById('content-title').textContent = 
                section.querySelector('h2').textContent;
            }
          });
        });
      });
    }
  
    // Search functionality
    async performSearch() {
      const query = this.searchElements.input.value.trim();
      if (!query) return;
  
      // Show loading state
      this.searchElements.results.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Finding the best options for you...</p>
        </div>
      `;
  
      // Add to search history
      if (!this.currentUser.searchHistory.includes(query)) {
        this.currentUser.searchHistory.unshift(query);
        if (this.currentUser.searchHistory.length > 10) {
          this.currentUser.searchHistory.pop();
        }
        this.saveUserData();
        this.renderSearchHistory();
      }
  
      try {
        const recommendations = await this.getRecommendations(query);
        const platform = this.searchElements.platformFilter.value;
        
        let filteredResults = platform === 'all' 
          ? recommendations 
          : recommendations.filter(item => item.platform === platform);
  
        const sortBy = this.searchElements.sortFilter.value;
        filteredResults = this.sortRecommendations(filteredResults, sortBy);
  
        this.renderSearchResults(filteredResults);
      } catch (error) {
        console.error('Search failed:', error);
        this.searchElements.results.innerHTML = `
          <div class="error-message">
            <p>Sorry, we couldn't find any results. Please try a different search term.</p>
          </div>
        `;
      }
    }
  
    async getRecommendations(query) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - in a real app, this would be an API call
      const mockFoodItems = [
        {
          id: '1',
          title: `${this.getRandomFoodDescriptor()} ${query}`,
          description: this.getRandomDescription(query),
          price: (Math.random() * 200 + 50).toFixed(2),
          rating: (Math.random() * 2 + 3).toFixed(1),
          distance: `${Math.floor(Math.random() * 10) + 1} km`,
          platform: ['swiggy', 'zomato', 'blinkit'][Math.floor(Math.random() * 3)],
          cuisine: ['Indian', 'Italian', 'Chinese', 'Mexican'][Math.floor(Math.random() * 4)],
          mealType: ['Breakfast', 'Lunch', 'Dinner', 'Snack'][Math.floor(Math.random() * 4)],
          preparationTime: Math.floor(Math.random() * 30) + 10,
          isAvailable: Math.random() > 0.2,
          image: this.getRandomFoodImage(query),
          link: '#'
        },
        // Add more mock items as needed
      ];
  
      return mockFoodItems;
    }
  
    sortRecommendations(results, sortBy) {
      return [...results].sort((a, b) => {
        switch (sortBy) {
          case 'price-asc': return parseFloat(a.price) - parseFloat(b.price);
          case 'price-desc': return parseFloat(b.price) - parseFloat(a.price);
          case 'rating': return parseFloat(b.rating) - parseFloat(a.rating);
          case 'distance': return parseFloat(a.distance) - parseFloat(b.distance);
          default: return 0; // relevance
        }
      });
    }
  
    renderSearchResults(results) {
      if (!results.length) {
        this.searchElements.results.innerHTML = `
          <div class="no-results">
            <p>No results found that match your criteria. Try adjusting your filters.</p>
          </div>
        `;
        return;
      }
  
      this.searchElements.results.innerHTML = results.map(item => `
        <div class="result-card" data-id="${item.id}">
          <div class="result-image">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
            <span class="platform-badge">${item.platform}</span>
            <span class="distance-badge">${item.distance}</span>
          </div>
          <div class="result-content">
            <h3 class="result-title">${item.title}</h3>
            <p class="result-description">${item.description}</p>
            <div class="result-meta">
              <span class="result-price">₹${item.price}</span>
              <span class="result-rating">
                <i class="fas fa-star"></i> ${item.rating}
              </span>
            </div>
            <div class="result-actions">
              <button class="action-btn primary view-detail" data-id="${item.id}">
                <i class="fas fa-info-circle"></i> Details
              </button>
              <button class="action-btn secondary save-item" data-id="${item.id}">
                <i class="fas fa-bookmark"></i> Save
              </button>
            </div>
          </div>
        </div>
      `).join('');
  
      // Add event listeners
      document.querySelectorAll('.view-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.currentTarget.getAttribute('data-id');
          const item = results.find(i => i.id === itemId);
          this.showProductDetail(item);
        });
      });
  
      document.querySelectorAll('.save-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.currentTarget.getAttribute('data-id');
          const item = results.find(i => i.id === itemId);
          this.saveItem(item);
        });
      });
    }
  
    showProductDetail(item) {
      document.getElementById('modal-body').innerHTML = `
        <div class="modal-product">
          <div class="modal-product-image">
            <img src="${item.image}" alt="${item.title}">
          </div>
          <div class="modal-product-content">
            <h2 class="modal-product-title">${item.title}</h2>
            <span class="modal-product-platform">${item.platform}</span>
            <div class="modal-product-price">₹${item.price}</div>
            <div class="modal-product-rating">
              <div class="stars">
                ${'<i class="fas fa-star"></i>'.repeat(Math.floor(parseFloat(item.rating)))}
                ${parseFloat(item.rating) % 1 >= 0.5 ? '<i class="fas fa-star-half-alt"></i>' : ''}
              </div>
              <span>${item.rating} (${Math.floor(Math.random() * 100) + 10} reviews)</span>
            </div>
            <p class="modal-product-description">${item.description}</p>
            <div class="modal-product-details">
              <div class="detail-item"><strong>Cuisine:</strong> ${item.cuisine}</div>
              <div class="detail-item"><strong>Meal Type:</strong> ${item.mealType}</div>
              <div class="detail-item"><strong>Distance:</strong> ${item.distance}</div>
              <div class="detail-item"><strong>Preparation Time:</strong> ${item.preparationTime} mins</div>
              <div class="detail-item"><strong>Availability:</strong> ${item.isAvailable ? 'In Stock' : 'Out of Stock'}</div>
            </div>
            <div class="modal-actions">
              <button class="action-btn primary" id="order-now-btn">
                <i class="fas fa-shopping-cart"></i> Order Now
              </button>
              <button class="action-btn secondary" id="give-feedback-btn" data-id="${item.id}">
                <i class="fas fa-comment-alt"></i> Give Feedback
              </button>
            </div>
          </div>
        </div>
      `;
  
      document.getElementById('order-now-btn').addEventListener('click', () => {
        window.open(item.link, '_blank');
      });
  
      document.getElementById('give-feedback-btn').addEventListener('click', (e) => {
        document.getElementById('feedback-item-id').value = e.currentTarget.getAttribute('data-id');
        this.modals.product.classList.remove('active');
        this.modals.feedback.classList.add('active');
      });
  
      this.modals.product.classList.add('active');
    }
  
    // User data management
    saveItem(item) {
      if (!this.currentUser.savedItems.some(i => i.id === item.id)) {
        this.currentUser.savedItems.push(item);
        this.saveUserData();
        this.renderSavedItems();
        
        // Show notification
        this.showNotification(`${item.title} has been saved to your favorites!`);
      } else {
        this.showNotification('This item is already in your saved items!', 'warning');
      }
    }
  
    renderSearchHistory() {
      if (!this.currentUser.searchHistory.length) {
        this.dashboardElements.historyItems.innerHTML = '<p>Your search history is empty.</p>';
        return;
      }
  
      this.dashboardElements.historyItems.innerHTML = this.currentUser.searchHistory.map(term => `
        <div class="history-item" data-term="${term}">
          <i class="fas fa-search"></i>
          <div class="history-item-content">
            <div class="history-item-title">${term}</div>
            <div class="history-item-meta">
              <span>${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <button class="search-again-btn" data-term="${term}">
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      `).join('');
  
      document.querySelectorAll('.search-again-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const term = e.currentTarget.getAttribute('data-term');
          this.searchElements.input.value = term;
          this.performSearch();
          document.querySelector('[data-section="search"]').click();
        });
      });
    }
  
    renderSavedItems() {
      if (!this.currentUser.savedItems.length) {
        this.dashboardElements.savedItems.innerHTML = '<p>You have no saved items yet.</p>';
        return;
      }
  
      this.dashboardElements.savedItems.innerHTML = this.currentUser.savedItems.map(item => `
        <div class="saved-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          <div class="saved-item-content">
            <div class="saved-item-title">${item.title}</div>
            <div class="saved-item-meta">
              <span>${item.platform}</span>
              <span>₹${item.price}</span>
            </div>
          </div>
          <button class="remove-saved-btn" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('');
  
      document.querySelectorAll('.remove-saved-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = e.currentTarget.getAttribute('data-id');
          this.currentUser.savedItems = this.currentUser.savedItems.filter(i => i.id !== itemId);
          this.saveUserData();
          this.renderSavedItems();
          this.showNotification('Item removed from saved items');
        });
      });
    }
  
    // UI Components
    initAIChatHelper() {
      const chatHelper = document.querySelector('.ai-chat-helper');
      const toggleBtn = document.querySelector('.ai-helper-toggle');
      const closeBtn = document.querySelector('.close-chat');
  
      toggleBtn.addEventListener('click', () => {
        chatHelper.classList.toggle('active');
      });
  
      closeBtn.addEventListener('click', () => {
        chatHelper.classList.remove('active');
      });
  
      // Chat functionality
      const chatInput = document.querySelector('.chat-input input');
      const sendBtn = document.querySelector('.send-btn');
  
      const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
          this.addUserMessage(message);
          chatInput.value = '';
          
          // Simulate AI response
          setTimeout(() => {
            this.addAIMessage(this.generateAIResponse(message));
          }, 1000);
        }
      };
  
      sendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
  
      // Initial greeting
      this.addAIMessage("Hi there! I'm your FoodAI assistant. How can I help you today?");
    }
  
    addUserMessage(message) {
      const chatMessages = document.querySelector('.chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message user-message';
      messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    addAIMessage(message) {
      const chatMessages = document.querySelector('.chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ai-message';
      messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    generateAIResponse(message) {
      const responses = [
        "I can help you find great food options based on your preferences.",
        "Based on your dietary restrictions, I recommend checking our vegetarian options.",
        "I found several restaurants near you that serve that cuisine.",
        "Would you like me to filter results by your dietary preferences?",
        "That's a great choice! I can show you the best-rated options for that."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  
    initMenuToggle() {
      const menuToggle = document.getElementById('menu-toggle');
      const sidebar = document.querySelector('.sidebar');
  
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
  
    initSettingsTabs() {
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('[data-tab-content]');
  
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          
          tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
          btn.classList.add('active');
          
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-tab-content') === tabId) {
              content.classList.add('active');
            }
          });
        });
      });
    }
  
    initSavedItemsView() {
      const viewOptions = document.querySelectorAll('.view-option');
      const savedItemsContainer = document.getElementById('saved-items');
  
      viewOptions.forEach(option => {
        option.addEventListener('click', () => {
          const viewType = option.getAttribute('data-view');
          
          viewOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          
          savedItemsContainer.className = `saved-items ${viewType}-view`;
        });
      });
    }
  
    // Utility functions
    updateProgressBar(step) {
      const progressSteps = document.querySelectorAll('.progress-step');
      progressSteps.forEach((stepElement, index) => {
        if (index + 1 < step) {
          stepElement.classList.add('completed');
          stepElement.classList.remove('active');
        } else if (index + 1 === step) {
          stepElement.classList.add('active');
          stepElement.classList.remove('completed');
        } else {
          stepElement.classList.remove('active', 'completed');
        }
      });
    }
  
    showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    }
  
    closeAllModals() {
      Object.values(this.modals).forEach(modal => {
        if (modal.classList) modal.classList.remove('active');
      });
    }
  
    // Data helpers
    saveUserData() {
      localStorage.setItem('foodAIUser', JSON.stringify(this.currentUser));
    }
  
    loadUserData() {
      const savedUser = localStorage.getItem('foodAIUser');
      return savedUser ? JSON.parse(savedUser) : null;
    }
  
    getRandomFoodDescriptor() {
      const descriptors = ['Deluxe', 'Special', 'Premium', 'Gourmet', 'Authentic'];
      return descriptors[Math.floor(Math.random() * descriptors.length)];
    }
  
    getRandomDescription(query) {
      const descriptions = [
        `A delicious ${query} made with the finest ingredients.`,
        `Our famous ${query} that everyone loves.`,
        `Authentic ${query} recipe passed down for generations.`,
        `A modern twist on classic ${query}.`
      ];
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
  
    getRandomFoodImage(query) {
      const foodImages = {
        pizza: 'https://source.unsplash.com/random/300x200/?pizza',
        burger: 'https://source.unsplash.com/random/300x200/?burger',
        pasta: 'https://source.unsplash.com/random/300x200/?pasta',
        salad: 'https://source.unsplash.com/random/300x200/?salad',
        sushi: 'https://source.unsplash.com/random/300x200/?sushi',
        chicken: 'https://source.unsplash.com/random/300x200/?chicken',
        dessert: 'https://source.unsplash.com/random/300x200/?dessert',
        breakfast: 'https://source.unsplash.com/random/300x200/?breakfast'
      };
      
      for (const [key, value] of Object.entries(foodImages)) {
        if (query.toLowerCase().includes(key)) {
          return value;
        }
      }
      
      return 'https://source.unsplash.com/random/300x200/?food';
    }
  }
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const app = new FoodAIApp();
  });
  
  // Make app available globally for debugging
  window.FoodAIApp = FoodAIApp;