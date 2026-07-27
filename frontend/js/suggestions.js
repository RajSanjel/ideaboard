import API_CONFIG from "./config/api.js";
import { getCachedUser } from "./global/auth.js";

let currentPage = 1;
const limit = 5;
let isFetching = false;
let currentCategory = "All";
let currentStatus = "All";
let currentSort = "default";
let currentSearch = "";

const container = document.getElementById("suggestions_container");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");

async function loadSuggestions(page) {
    if (isFetching) return;
    isFetching = true;
    if (prevPageBtn) {
        prevPageBtn.disabled = true;
        prevPageBtn.classList.add("disabled");
    }
    if (nextPageBtn) {
        nextPageBtn.disabled = true;
        nextPageBtn.classList.add("disabled");
    }

    pageIndicator.textContent = `Loading...`;
    try {
        let url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}?page=${page}&limit=${limit}`;

        if (currentCategory && currentCategory !== "All") url += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentSort && currentSort !== "default") url += `&sort=${encodeURIComponent(currentSort)}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        if (currentStatus && currentStatus !== "All") url += `&status=${encodeURIComponent(currentStatus)}`;

        const resp = await fetch(url);

        if (!resp.ok) throw new Error(`Server responded with status ${resp.status}`);

        const responseData = await resp.json();

        if (responseData.httpCode === 200) {
            const suggestions = responseData.data;
            container.innerHTML = "";

            if (suggestions.length === 0) {
                container.innerHTML = `
                    <div class="empty_suggestions_state">
                        <p class="empty_title">No suggestions found</p>
                        <p class="empty_desc">Looks like there are no ideas here yet. Be the first to submit one!</p>
                    </div>
                `;
            } else {
                suggestions.forEach(suggestion => {
                    const cardHTML = buildSuggestionCard(suggestion);
                    container.insertAdjacentHTML('beforeend', cardHTML);
                });
            }

            pageIndicator.textContent = `Page ${page}`;

            if (page === 1) {
                prevPageBtn.disabled = true;
                prevPageBtn.classList.add("disabled");
            } else {
                prevPageBtn.disabled = false;
                prevPageBtn.classList.remove("disabled");
            }

            if (suggestions.length < limit) {
                nextPageBtn.disabled = true;
                nextPageBtn.classList.add("disabled");
            } else {
                nextPageBtn.disabled = false;
                nextPageBtn.classList.remove("disabled");
            }
        } else {
            throw new Error(responseData.message || "Failed to fetch data");
        }
    } catch (error) {
        console.error("Failed to load suggestions:", error);

        pageIndicator.textContent = `Error`;
        container.innerHTML = `
            <div class="empty_suggestions_state error_state">
                <p class="empty_title">Oops! Something went wrong.</p>
                <p class="empty_desc">We couldn't load the suggestions. Please check your connection and try again.</p>
                <button onclick="window.location.reload()" class="button_secondary" style="margin-top: 15px;">Refresh Page</button>
            </div>
        `;
    } finally {
        isFetching = false;
    }
}
async function renderCategoryTabs() {
    const categoryTabsContainer = document.getElementById("category_tabs");
    if (!categoryTabsContainer) return;

    try {
        const response = await fetch('../../shared/categories.json');

        if (!response.ok) {
            throw new Error(`Failed to load categories: ${response.status}`);
        }

        const categories = await response.json();

        categoryTabsContainer.innerHTML = "";

        const allSpan = document.createElement("span");
        allSpan.dataset.category = "All";
        allSpan.textContent = "All";
        allSpan.className = `browse_category ${currentCategory === "All" ? "category_selected" : ""}`;
        categoryTabsContainer.appendChild(allSpan);

        categories.forEach(category => {
            const span = document.createElement("span");

            span.dataset.category = category.id;
            span.textContent = category.label;

            const isSelected = currentCategory === category.id ? "category_selected" : "";
            span.className = `browse_category ${isSelected}`;

            categoryTabsContainer.appendChild(span);
        });

    } catch (error) {
        console.error("Error loading categories:", error);
        categoryTabsContainer.innerHTML = `<span class="browse_category">Error loading categories</span>`;
    }
}

async function fetchStats() {
    try {
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}/stats`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();

        if (result.success && result.data) {
            const stats = result.data;

            const totalEl = document.getElementById('stat-total');
            const openEl = document.getElementById('stat-open');
            const progressEl = document.getElementById('stat-progress');
            const completedEl = document.getElementById('stat-completed');

            if (totalEl) totalEl.textContent = stats.total;
            if (openEl) openEl.textContent = stats.open;
            if (progressEl) progressEl.textContent = stats.in_progress;
            if (completedEl) completedEl.textContent = stats.completed;

            updateStatusBar('bar-open', stats.open, stats.total);
            updateStatusBar('bar-review', stats.review, stats.total);
            updateStatusBar('bar-planned', stats.planned, stats.total);
            updateStatusBar('bar-progress', stats.in_progress, stats.total);
            updateStatusBar('bar-completed', stats.completed, stats.total);
        }
    } catch (error) {
        console.error('Error fetching suggestion stats:', error);
    }
}

function updateStatusBar(elementId, count, total) {
    const barEl = document.getElementById(elementId);
    if (!barEl) return;

    // Calculate percentage width (0% if no suggestions exist yet)
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    // Update CSS variables inline
    barEl.style.setProperty('--progress', `${percentage}%`);
    barEl.style.setProperty('--count', `"${count}"`);
}


async function fetchTopVoted() {
    try {
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}?sort=most_votes&limit=1`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        const topContainer = document.getElementById('top_voted_container');

        if (result.success && result.data && result.data.length > 0) {
            const suggestion = result.data[0];
            const statusConfig = getStatusConfig(suggestion.status);

            document.getElementById('top_voted_title').textContent = suggestion.title;
            document.getElementById('top_voted_desc').textContent = suggestion.description.substring(0, 300) + '...';

            const statusEl = document.getElementById('top_voted_status');
            statusEl.textContent = statusConfig.label;
            statusEl.className = `tag ${statusConfig.class}`;

            document.getElementById('top_voted_count').innerHTML = `<img src="./public/vote.svg" height="8px" style="margin-right: 2px;"> ${suggestion.votes || 0} votes`;
            document.getElementById('top_voted_link').href = `suggestion.html?refId=${suggestion.ref}`;

            if (topContainer) topContainer.style.display = '';
        } else {
            if (topContainer) topContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching top voted suggestion:', error);
    }
}


function buildSuggestionCard(suggestion) {
    const statusConfig = getStatusConfig(suggestion.status);
    const timeAgo = formatTimeAgo(new Date(suggestion.created_at));
    const user = getCachedUser();
    const voteBtnClass = user ? "" : "disabled";

    return `
       <div class="suggestion_container ${statusConfig.class}" onclick="window.location.href='suggestion.html?refId=${suggestion.ref}'">
            
            <div class="left vote_btn ${voteBtnClass}" onclick="event.stopPropagation(); console.log('Vote clicked for:', '${suggestion.ref}');">
                <span class="vote_count">
                    <img src="./public/vote.svg" height="20px">
                    <span class="vote_count">${suggestion.votes || 0}</span>
                </span>
            </div>
            
            <div class="middle">
                <p class="suggestion_title">${suggestion.title}</p>
                <p class="suggestion_desc">${suggestion.description.substring(0, 200)}...</p>
                <div class="details">
                    <span>${suggestion.author_name}</span>
                    <span>${suggestion.category}</span>
                    <span>${suggestion.comments_count || 0} Comments</span>
                    <span>${timeAgo}</span>
                </div>
            </div>
            <div class="left">
                <span class="tag ${statusConfig.class}">${statusConfig.label}</span>
                <span class="suggestion_progress_line">
                    <span class="suggestion_progress_line">
                        ${statusConfig.progressSteps}
                    </span>
                </span>
                <span class="suggestion_ref_id">${suggestion.ref}</span>
            </div>
        </div>
    `;
}

function getStatusConfig(status) {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus === 'open') {
        return { class: 'open', label: 'Open', progressSteps: '<span class="step completed"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
    }
    if (lowerStatus === 'review') {
        return { class: 'review', label: 'Reviewing', progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
    }
    if (lowerStatus === 'planned') {
        return { class: 'planned', label: 'On Agenda', progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step"></span><span class="step"></span>' };
    }
    if (lowerStatus === 'progress') {
        return { class: 'progress', label: 'In Progress', progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step"></span>' };
    }
    if (lowerStatus === 'done') {
        return { class: 'done', label: 'Completed', progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span>' };
    }
    if (lowerStatus === 'rejected') {
        return { class: 'rejected', label: 'Rejected', progressSteps: '<span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
    }

    return { class: 'open', label: status, progressSteps: '<span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const categoryTabsContainer = document.getElementById("category_tabs");
if (categoryTabsContainer) {
    categoryTabsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("browse_category")) {

            currentCategory = e.target.dataset.category;
            currentPage = 1;
            renderCategoryTabs();
            loadSuggestions(currentPage);
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {

    renderCategoryTabs();
    loadSuggestions(currentPage);
    fetchStats();
    fetchTopVoted();

    const statusItems = document.querySelectorAll(".stats_visual_item");
    statusItems.forEach(item => {
        item.addEventListener("click", (e) => {
            const clickedStatus = e.currentTarget.dataset.status;
            if (currentStatus === clickedStatus) {
                currentStatus = "All";
                e.currentTarget.classList.remove("status_selected");
            } else {
                currentStatus = clickedStatus;
                statusItems.forEach(i => i.classList.remove("status_selected"));
                e.currentTarget.classList.add("status_selected");
            }

            currentPage = 1;
            loadSuggestions(currentPage);
        });
    });

    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            loadSuggestions(currentPage);
        });
    }

    const searchInput = document.getElementById("searchInput");
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value.trim();
                currentPage = 1;
                loadSuggestions(currentPage);
            }, 300);
        });
    }
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                loadSuggestions(currentPage);
                document.querySelector('.suggestions_list_header').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            currentPage++;
            loadSuggestions(currentPage);
            document.querySelector('.suggestions_list_header').scrollIntoView({ behavior: 'smooth' });
        });
    }
});