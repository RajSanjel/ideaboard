export function getStatusConfig(status) {
    const lowerStatus = (status || 'open').toLowerCase();

    if (lowerStatus === 'open') return { class: 'open', label: 'Open', stepIndex: 0, progressSteps: '<span class="step completed"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
    if (lowerStatus === 'review') return { class: 'review', label: 'Reviewing', stepIndex: 1, progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
    if (lowerStatus === 'planned') return { class: 'planned', label: 'On Agenda', stepIndex: 2, progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step"></span><span class="step"></span>' };
    if (lowerStatus === 'progress') return { class: 'progress', label: 'In Progress', stepIndex: 3, progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step"></span>' };
    if (lowerStatus === 'done' || lowerStatus === 'completed') return { class: 'done', label: 'Completed', stepIndex: 4, isComplete: true, progressSteps: '<span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span><span class="step completed"></span>' };
    if (lowerStatus === 'rejected') return { class: 'rejected', label: 'Rejected', stepIndex: -1, progressSteps: '<span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };

    return { class: 'open', label: status || 'Unknown', stepIndex: 0, progressSteps: '<span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span><span class="step"></span>' };
}

export function formatTimeAgo(dateInput) {
    const date = new Date(dateInput);
    const seconds = Math.max(0, Math.floor((new Date() - date) / 1000));

    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");

    return "just now";
}

export function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function getInitials(name) {
    if (!name || name.trim() === "") return "UN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

// Caches categories so we only fetch them once per page load
let cachedCategories = null;
export async function getCategoryLabel(categoryId) {
    const fallbackCategories = {
        "bell_schedule": "Bell schedule",
        "cafeteria": "Cafeteria",
        "facilities": "Facilities",
        "family_communications": "Family communications",
        "programs": "Programs",
        "transport": "Transport",
        "wellness": "Wellness",
        "athletics": "Athletics",
        "calendar": "Calendar",
        "general": "General"
    };

    if (!cachedCategories) {
        try {
            const response = await fetch('../../shared/categories.json');
            if (response.ok) {
                cachedCategories = await response.json();
            }
        } catch (error) {
            console.warn("Using fallback categories mapping due to fetch error.");
        }
    }

    if (cachedCategories) {
        const found = cachedCategories.find(c => c.id === categoryId);
        if (found) return found.label;
    }

    return fallbackCategories[categoryId] || categoryId;
}
