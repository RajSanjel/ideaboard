import API_CONFIG from "./config/api.js";
import { getCachedUser } from "./global/auth.js";
import {
    getStatusConfig,
    formatTimeAgo
} from "./util/helpers.js";

let currentPage = 1;
const limit = 5;
let isFetching = false;
let currentCategory = "All";
let currentStatus = "All";
let currentSort = "default";
let currentSearch = "";

let categoryMap = {};

function truncateText(text, maxLength = 130) {
    if (!text || text.length <= maxLength) return text;
    const trimmed = text.substring(0, maxLength);
    const lastSpace = trimmed.lastIndexOf(" ");
    return (lastSpace > 0 ? trimmed.substring(0, lastSpace) : trimmed) + "...";
}

async function loadSuggestions(page) {
    if (isFetching) return;
    isFetching = true;

    const container = document.getElementById("suggestions_container");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    if (prevPageBtn) {
        prevPageBtn.disabled = true;
        prevPageBtn.classList.add("disabled");
    }
    if (nextPageBtn) {
        nextPageBtn.disabled = true;
        nextPageBtn.classList.add("disabled");
    }

    if (pageIndicator) pageIndicator.textContent = `Loading...`;

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

            if (suggestions.length === 0 && page > 1) {
                currentPage = page - 1;

                if (pageIndicator) pageIndicator.textContent = `Page ${currentPage}`;

                if (prevPageBtn) {
                    prevPageBtn.disabled = currentPage === 1;
                    prevPageBtn.classList.toggle("disabled", currentPage === 1);
                }
                if (nextPageBtn) {
                    nextPageBtn.disabled = true;
                    nextPageBtn.classList.add("disabled");
                }

                return;
            }

            if (container) container.innerHTML = "";

            if (suggestions.length === 0) {
                if (container) {
                    container.innerHTML = `
                        <div class="empty_suggestions_state">
                            <p class="empty_title">No suggestions found</p>
                            <p class="empty_desc">Looks like there are no ideas matching your criteria. Be the first to submit one!</p>
                        </div>
                    `;
                }
            } else {
                suggestions.forEach(suggestion => {
                    const cardHTML = buildSuggestionCard(suggestion);
                    if (container) container.insertAdjacentHTML('beforeend', cardHTML);
                });
            }

            if (pageIndicator) pageIndicator.textContent = `Page ${page}`;

            if (prevPageBtn) {
                if (page === 1) {
                    prevPageBtn.disabled = true;
                    prevPageBtn.classList.add("disabled");
                } else {
                    prevPageBtn.disabled = false;
                    prevPageBtn.classList.remove("disabled");
                }
            }

            if (nextPageBtn) {
                if (suggestions.length < limit) {
                    nextPageBtn.disabled = true;
                    nextPageBtn.classList.add("disabled");
                } else {
                    nextPageBtn.disabled = false;
                    nextPageBtn.classList.remove("disabled");
                }
            }
        } else {
            throw new Error(responseData.message || "Failed to fetch data");
        }
    } catch (error) {
        console.error("Failed to load suggestions:", error);

        if (pageIndicator) pageIndicator.textContent = `Error`;
        if (container) {
            container.innerHTML = `
                <div class="empty_suggestions_state error_state">
                    <p class="empty_title">Oops! Something went wrong.</p>
                    <p class="empty_desc">We couldn't load the suggestions. Please check your connection and try again.</p>
                    <button onclick="window.location.reload()" class="button_secondary" style="margin-top: 15px;">Refresh Page</button>
                </div>
            `;
        }

        if (prevPageBtn) { prevPageBtn.disabled = true; prevPageBtn.classList.add("disabled"); }
        if (nextPageBtn) { nextPageBtn.disabled = true; nextPageBtn.classList.add("disabled"); }

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
            categoryMap[category.id] = category.label;

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

    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
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

            const titleEl = document.getElementById('top_voted_title');
            const descEl = document.getElementById('top_voted_desc');
            const statusEl = document.getElementById('top_voted_status');
            const countEl = document.getElementById('top_voted_count');
            const linkEl = document.getElementById('top_voted_link');

            const authorEl = document.getElementById('top_voted_author');
            const categoryEl = document.getElementById('top_voted_category');
            const dateEl = document.getElementById('top_voted_date');

            if (titleEl) titleEl.textContent = suggestion.title;

            if (descEl) {
                descEl.textContent = truncateText(suggestion.description || "", 130);
            }

            if (statusEl) {
                statusEl.textContent = statusConfig.label;
                statusEl.className = `tag ${statusConfig.class}`;
            }

            if (countEl) countEl.innerHTML = `<img src="./public/vote.svg" height="8px" style="margin-right: 2px;"> ${suggestion.votes || 0} votes`;
            if (linkEl) linkEl.href = `suggestion.html?refId=${suggestion.ref}`;

            const displayCategory = categoryMap[suggestion.category] || suggestion.category;
            const timeAgo = formatTimeAgo(new Date(suggestion.created_at));

            if (authorEl) authorEl.textContent = suggestion.author_name || "Anonymous";
            if (categoryEl) categoryEl.textContent = displayCategory;
            if (dateEl) dateEl.textContent = timeAgo;

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

    const displayCategory = categoryMap[suggestion.category] || suggestion.category;

    const truncatedDesc = truncateText(suggestion.description || "", 180);

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
                <p class="suggestion_desc">${truncatedDesc}</p>
                <div class="details">
                    <span>${suggestion.author_name}</span>
                    <span>${displayCategory}</span>
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

document.addEventListener("DOMContentLoaded", async () => {

    const categoryTabsContainer = document.getElementById("category_tabs");

    if (categoryTabsContainer) {
        categoryTabsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("browse_category")) {
                currentCategory = e.target.dataset.category;
                currentPage = 1;

                document.querySelectorAll(".browse_category").forEach(tab => {
                    tab.classList.toggle("category_selected", tab.dataset.category === currentCategory);
                });

                loadSuggestions(currentPage);
            }
        });
    }

    await renderCategoryTabs();

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

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (prevPageBtn.classList.contains("disabled") || prevPageBtn.disabled) return;

            if (currentPage > 1) {
                currentPage--;
                await loadSuggestions(currentPage);
                const header = document.querySelector('.suggestions_list_header');
                if (header) header.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (nextPageBtn.classList.contains("disabled") || nextPageBtn.disabled) return;

            const previousPage = currentPage;
            currentPage++;

            await loadSuggestions(currentPage);

            if (currentPage > previousPage) {
                const header = document.querySelector('.suggestions_list_header');
                if (header) header.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});