// ============================================
// SERMON FILTER FUNCTIONALITY
// ============================================

/**
 * Initialize the filter functionality when the page loads
 */
function initializeSermonFilters() {
    // Get all filter buttons
    const filterButtons = document.querySelectorAll('.filter-button');
    
    // Add click event listener to each button
    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            // Get the filter category from the button's data attribute
            const selectedCategory = this.getAttribute('data-filter');
            
            // Filter the sermon cards based on the selected category
            filterSermonCards(selectedCategory);
            
            // Update the active button styling
            updateActiveFilterButton(this);
        });
    });
}

/**
 * Filter sermon cards based on the selected category
 * @param {string} category - The category to filter by (e.g., 'all', 'sermon', 'bible-study')
 */
function filterSermonCards(category) {
    // Get all sermon cards
    const allSermonCards = document.querySelectorAll('.sermon-card');
    
    // Loop through each card and show/hide based on category
    allSermonCards.forEach(function(card) {
        const cardCategory = card.getAttribute('data-category');
        
        // Show card if category is 'all' or matches the card's category
        if (category === 'all' || cardCategory === category) {
            card.classList.remove('is-hidden');
            card.style.display = 'block';
        } else {
            card.classList.add('is-hidden');
            card.style.display = 'none';
        }
    });
}

/**
 * Update the active state of filter buttons
 * @param {HTMLElement} activeButton - The button that was clicked
 */
function updateActiveFilterButton(activeButton) {
    // Remove 'is-active' class from all buttons
    const allFilterButtons = document.querySelectorAll('.filter-button');
    allFilterButtons.forEach(function(button) {
        button.classList.remove('is-active');
    });
    
    // Add 'is-active' class to the clicked button
    activeButton.classList.add('is-active');
}


// ============================================
// SERMON CARD CLICK HANDLERS
// ============================================

/**
 * Initialize click handlers for sermon cards
 */
function initializeSermonCardClicks() {
    const allSermonCards = document.querySelectorAll('.sermon-card');
    
    allSermonCards.forEach(function(card) {
        card.addEventListener('click', function() {
            handleSermonCardClick(this);
        });
    });
}

/**
 * Handle when a sermon card is clicked
 * @param {HTMLElement} card - The sermon card that was clicked
 */
function handleSermonCardClick(card) {
    // Standardized query parameters for streaming page navigation
    // Self-hosted flow (player.html): title, src, poster?, speaker?, date?, duration?
    // YouTube flow (sermon.html): title, youtubeId

    // Prefer explicit data attributes on the card
    const titleAttr = card.getAttribute('data-title');
    const youtubeIdAttr = card.getAttribute('data-youtube-id');
    const srcAttr = card.getAttribute('data-src');
    const posterAttr = card.getAttribute('data-poster');
    const speakerAttr = card.getAttribute('data-speaker');
    const dateAttr = card.getAttribute('data-date');
    const durationAttr = card.getAttribute('data-duration');

    // Fallback title from inner content as needed
    const cardTitleEl = card.querySelector('.sermon-title');
    const title = (titleAttr || (cardTitleEl ? cardTitleEl.textContent.trim() : '') || 'Sermon');

    if (srcAttr) {
        // Self-hosted path
        const params = new URLSearchParams();
        params.set('title', title);
        params.set('src', srcAttr);
        if (posterAttr) params.set('poster', posterAttr);
        if (speakerAttr) params.set('speaker', speakerAttr);
        if (dateAttr) params.set('date', dateAttr);
        if (durationAttr) params.set('duration', durationAttr);
        window.location.href = 'player.html?' + params.toString();
        return;
    }

    if (youtubeIdAttr) {
        // YouTube path
        const params = new URLSearchParams();
        params.set('title', title);
        params.set('youtubeId', youtubeIdAttr.trim());
        window.location.href = 'sermon.html?' + params.toString();
        return;
    }

    // No recognizable source; no-op or could show a message
    console.warn('Sermon card missing data-src or data-youtube-id.');
}


// ============================================
// EVENT ITEM CLICK HANDLERS
// ============================================

/**
 * Initialize click handlers for event items
 */
function initializeEventClicks() {
    const allEventItems = document.querySelectorAll('.event-item');
    
    allEventItems.forEach(function(eventItem) {
        eventItem.addEventListener('click', function() {
            handleEventClick(this);
        });
    });
}

/**
 * Handle when an event item is clicked
 * @param {HTMLElement} eventItem - The event item that was clicked
 */
function handleEventClick(eventItem) {
    // Get event information
    const eventTitle = eventItem.querySelector('.event-title').textContent;
    
    // For now, show an alert (in production, this would navigate to an event detail page)
    alert('You clicked on: ' + eventTitle + '\n\nThis would link to the full event details with registration options.');
    
    // In a real application, you might do:
    // window.location.href = '/event-detail.html?id=' + eventId;
}


// ============================================
// PAGE INITIALIZATION
// ============================================

/**
 * Initialize all functionality when the page loads
 */
function initializePage() {
    // Initialize sermon filters
    initializeSermonFilters();
    
    // Initialize sermon card clicks
    initializeSermonCardClicks();
    
    // Initialize event clicks
    initializeEventClicks();
    
    console.log('Church website initialized successfully!');
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializePage);