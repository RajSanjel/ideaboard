import API_CONFIG from "./config/api.js";
import { getCachedUser } from "./global/auth.js";

let currentPage = 1;
const limit = 5;
let isFetching = false;

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
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}?page=${page}&limit=${limit}`;

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

document.addEventListener("DOMContentLoaded", () => {

    loadSuggestions(currentPage);

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