import API_CONFIG from './config/api.js';

async function fetchAndDisplayStats() {
    try {
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}/stats`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
        } else {
            console.error('Failed to load stats:', result.message);
        }
    } catch (error) {
        console.error('Error fetching suggestion stats:', error);

        const dataSpans = document.querySelectorAll('.card_item .data');
        dataSpans.forEach(span => span.textContent = '0');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayStats();
});
