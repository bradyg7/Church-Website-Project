/**
 * @file script.js
 * @description This file manages dynamic content loading, event handling, and
 *              sermon/event rendering for the Church Website.
 *              It includes functionalities for filtering sermons, loading
 *              layout components (header/footer), and fetching data from JSON files.
 */

// ============================================
// DYNAMIC CONTENT LOADING
// ============================================

(function(){
    // DOM element references
    const sermonGrid = document.getElementById('sermonCardsGrid');
    const eventsList = document.querySelector('.events-list-container');
    const siteHeader = document.querySelector('.site-header');
    const siteFooter = document.querySelector('.site-footer');
    const loadMoreBtn = document.getElementById('loadMoreSermons');

    if (sermonGrid) {
        // Sermon loading configuration
        const initialSermonLimit = 6; // Number of sermons to load initially on index.html
        const sermonsPerPage = 6;    // Number of sermons to load per "Load More" click
        let currentSermonPage = 0;   // Tracks the current page of sermons loaded

        let allSermonsData = []; // Stores all sermons after initial fetch for filtering and pagination

        /**
         * Initializes event listeners for sermon filter buttons.
         * When a filter button is clicked, it filters the displayed sermon cards
         * and updates the active state of the filter buttons.
         */
        function initializeSermonFilters() {
            const filterButtons = document.querySelectorAll('.filter-button');
            filterButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                    const selectedCategory = this.getAttribute('data-filter');
                    filterSermonCards(selectedCategory);
                    updateActiveFilterButton(this);
                });
            });
        }

        /**
         * Filters sermon cards based on the provided category.
         * Sermon cards that do not match the category are hidden.
         * @param {string} category - The category to filter by ('all', 'sermon', 'bible-study', 'worship').
         */
        function filterSermonCards(category) {
            const allSermonCards = document.querySelectorAll('.sermon-card');
            allSermonCards.forEach(function(card) {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'all' || cardCategory === category) {
                    card.classList.remove('is-hidden');
                } else {
                    card.classList.add('is-hidden');
                }
            });
        }

        /**
         * Updates the visual active state of sermon filter buttons.
         * @param {HTMLElement} activeButton - The button that was just clicked and should be marked as active.
         */
        function updateActiveFilterButton(activeButton) {
            const allFilterButtons = document.querySelectorAll('.filter-button');
            allFilterButtons.forEach(function(button) {
                button.classList.remove('is-active');
            });
            activeButton.classList.add('is-active');
        }



        /**
         * Creates an HTML article element representing a sermon card.
         * @param {object} sermonData - Object containing sermon details.
         * @param {string} sermonData.title - The title of the sermon.
         * @param {string} sermonData.youtubeId - The YouTube video ID for the sermon.
         * @param {string} sermonData.date - The date of the sermon.
         * @param {string} sermonData.speaker - The speaker of the sermon.
         * @returns {HTMLElement} An HTML article element configured as a sermon card.
         */
        function createSermonCard({ title, youtubeId, date, speaker }){
            const article = document.createElement('article');
            article.className = 'sermon-card';
            article.setAttribute('data-category', 'sermon');
            article.setAttribute('data-title', title || 'Sermon');
            article.setAttribute('data-youtube-id', youtubeId);

            const thumbUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

            article.innerHTML = `
                <a href="sermon.html?title=${encodeURIComponent(title)}&youtubeId=${youtubeId}" class="sermon-card-link">
                    <div class="sermon-card-thumbnail" style="background: none; padding: 0;">
                        <img src="${thumbUrl}" alt="${title || 'Sermon'} thumbnail" style="width:100%; height:auto; display:block; aspect-ratio:16/9; object-fit:cover;" />
                    </div>
                    <div class="sermon-card-content">
                        <span class="sermon-category-tag">Sermon</span>
                        <h3 class="sermon-title">${title || 'Sermon'}</h3>
                        <div class="sermon-metadata">
                            <span class="sermon-date">📅 ${date || ''}</span>
                            <span class="sermon-speaker">👤 ${speaker || ''}</span>
                        </div>
                        <p class="sermon-description">Watch this sermon on our streaming page.</p>
                    </div>
                </a>
            `;
            return article;
        }

        /**
         * Checks if a YouTube video can be embedded by attempting to fetch its oEmbed data.
         * This helps in filtering out private or unavailable videos.
         * @param {string} videoId - The YouTube video ID.
         * @returns {Promise<boolean>} True if the video can be embedded, false otherwise.
         */
        async function canEmbed(videoId){
            const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
            try {
                const res = await fetch(url, { method: 'GET' });
                return res.ok;
            } catch (e) {
                return false;
            }
        }

        /**
         * Fetches sermon data from 'data/sermons.json', sorts it by date (newest first),
         * and handles potential errors during the fetch operation.
         * @returns {Promise<Array>} A promise that resolves to an array of sermon objects, or an empty array if fetching fails.
         */
        async function fetchSermonsData() {
            try {
                const res = await fetch('data/sermons.json', { cache: 'no-store' });
                if (!res.ok) {
                    console.error('Failed to fetch sermons:', res.statusText);
                    return [];
                }
                let list = await res.json();
                if (!Array.isArray(list)) {
                    console.error('Sermons data is not an array.');
                    return [];
                }

                return list.slice().sort((a,b) => {
                    const da = a && a.date ? Date.parse(a.date) : 0;
                    const db = b && b.date ? Date.parse(b.date) : 0;
                    return db - da; // newest first
                });
            } catch (err) {
                console.error('Failed to load sermons:', err);
                return [];
            }
        }

        /**
         * Renders an array of sermon objects into the sermon grid.
         * Each sermon is checked for embeddability before creating and appending its card.
         * @param {Array<object>} sermonsToRender - An array of sermon objects to be rendered.
         */
        async function renderSermons(sermonsToRender) {
            if (!sermonGrid) return;
            
            for (const item of sermonsToRender){
                if (!item.youtubeId) continue;
                const ok = await canEmbed(item.youtubeId);
                if (!ok) continue; // skip restricted/unavailable videos
                const card = createSermonCard(item);
                sermonGrid.appendChild(card);
            }
        }

        /**
         * Loads the initial set of sermons based on the page being viewed (index.html or all-sermons.html).
         * Manages the visibility and functionality of the "Load More Sermons" button.
         */
        async function loadInitialSermons() {
            allSermonsData = await fetchSermonsData();
            
            const path = window.location.pathname;
            if (path.endsWith('index.html') || path === '/') {
                const sermonsToShow = allSermonsData.slice(0, initialSermonLimit);
                await renderSermons(sermonsToShow);
                currentSermonPage = 1; // Mark that the first page has been loaded

                if (allSermonsData.length > initialSermonLimit && loadMoreBtn) {
                    loadMoreBtn.style.display = 'block';
                    loadMoreBtn.addEventListener('click', loadMoreSermons);
                } else if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            } else if (path.endsWith('all-sermons.html')) {
                await renderSermons(allSermonsData);
                if (loadMoreBtn) loadMoreBtn.style.display = 'none'; // Ensure button is hidden on all-sermons page
            }
        }

        /**
         * Loads additional sermons when the "Load More Sermons" button is clicked.
         * Renders a batch of sermons and hides the button if all sermons have been loaded.
         */
        async function loadMoreSermons() {
            const startIndex = currentSermonPage * sermonsPerPage;
            const endIndex = startIndex + sermonsPerPage;
            const sermonsToLoad = allSermonsData.slice(startIndex, endIndex);

            if (sermonsToLoad.length > 0) {
                await renderSermons(sermonsToLoad);
                currentSermonPage++;
            }

            if (endIndex >= allSermonsData.length && loadMoreBtn) {
                loadMoreBtn.style.display = 'none'; // Hide button if no more sermons
            }
        }
    }

    if (eventsList) {
        /**
         * Initializes click event listeners for all event items.
         * When an event item is clicked, it triggers the handleEventClick function.
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
         * Handles the click event on an event item.
         * Extracts event details from data attributes and navigates to 'event-detail.html'.
         * @param {HTMLElement} eventItem - The event item HTML element that was clicked.
         */
        function handleEventClick(eventItem) {
            const title = eventItem.getAttribute('data-title');
            const location = eventItem.getAttribute('data-location');
            const time = eventItem.getAttribute('data-time');
            const date = eventItem.getAttribute('data-date');
            const description = eventItem.getAttribute('data-description');
            const registrationUrl = eventItem.getAttribute('data-registration-url');

            const params = new URLSearchParams();
            params.set('title', title);
            params.set('location', location);
            params.set('time', time);
            params.set('date', date);
            params.set('description', description);
            if (registrationUrl) {
                params.set('registrationUrl', registrationUrl);
            }
            window.location.href = 'event-detail.html?' + params.toString();
        }

        /**
         * Creates an HTML article element representing an event item.
         * @param {object} eventData - Object containing event details.
         * @param {string} eventData.day - The day of the month for the event.
         * @param {string} eventData.month - The month of the event.
         * @param {string} eventData.title - The title of the event.
         * @param {string} eventData.location - The location of the event.
         * @param {string} eventData.time - The time of the event.
         * @param {string} eventData.description - A brief description of the event.
         * @param {string} [eventData.registrationUrl] - Optional URL for event registration.
         * @returns {HTMLElement} An HTML article element configured as an event item.
         */
        function createEventItem({ day, month, title, location, time, description, registrationUrl }){
            const article = document.createElement('article');
            article.className = 'event-item';
            article.setAttribute('data-title', title);
            article.setAttribute('data-location', location);
            article.setAttribute('data-time', time);
            article.setAttribute('data-date', `${day} ${month}`); // Combine day and month for date
            article.setAttribute('data-description', description);
            if (registrationUrl) {
                article.setAttribute('data-registration-url', registrationUrl);
            }

            article.innerHTML = `
                <div class="event-date-box">
                    <div class="event-day">${day}</div>
                    <div class="event-month">${month}</div>
                </div>
                <div class="event-information">
                    <h3 class="event-title">${title}</h3>
                    <div class="event-location-time">
                        📍 ${location} | ⏰ ${time}
                    </div>
                    <p class="event-description">${description}</p>
                </div>
            `;
            return article;
        }

        /**
         * Fetches and renders event data onto the 'all-events.html' page.
         * Creates and appends event items to the events list.
         */
        async function loadEvents() {
            try {
                const res = await fetch('../data/events.json', { cache: 'no-store' });
                if (!res.ok) return;
                const list = await res.json();
                if (!Array.isArray(list)) return;

                eventsList.innerHTML = '';

                for (const item of list) {
                    const eventItem = createEventItem(item);
                    eventsList.appendChild(eventItem);
                }

                initializeEventClicks();
            } catch (err) {
                console.error('Failed to load events:', err);
            }
        }
    }


    /**
     * Dynamically loads common layout components like the header and footer
     * into their respective placeholders on the page.
     * Assumes _header.html and _footer.html are available at the root level (public/).
     */
    async function loadLayout() {
        if (siteHeader) {
            const response = await fetch('_header.html');
            const data = await response.text();
            siteHeader.innerHTML = data;
        }
        if (siteFooter) {
            const response = await fetch('_footer.html');
            const data = await response.text();
            siteFooter.innerHTML = data;
        }
    }

    /**
     * Event listener that triggers when the DOM is fully loaded.
     * It initiates the loading of layout components, sermon filters, and initial sermons/events.
     */
    document.addEventListener('DOMContentLoaded', () => {
        loadLayout(); // Load header and footer
        if(sermonGrid) {
            initializeSermonFilters(); // Setup sermon category filters
            loadInitialSermons(); // Load sermons based on the current page
        }
        
        if (eventsList) {
            loadEvents();
        }
        console.log('Church website initialized successfully!');
    });
})();
