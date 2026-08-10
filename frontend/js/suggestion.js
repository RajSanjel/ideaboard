import API_CONFIG from "./config/api.js";
import { getCachedUser } from "./global/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("refId");

    const contentWrapper = document.getElementById("suggestion_content_wrapper");
    const errorContainer = document.getElementById("suggestion_error_container");
    const errorMessageText = document.getElementById("error_message_text");

    if (!refCode) {
        showNotFoundError("No suggestion reference code provided in the URL.");
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}/detail?refId=${refCode}`);
        const result = await response.json();

        if (!result.success || !result.data || result.httpCode !== 200) {
            showNotFoundError(result.message || "The suggestion you requested could not be found.");
            return;
        }

        const suggestion = result.data;

        document.querySelector(".suggestion_ref_id").textContent = suggestion.ref;
        document.querySelector(".suggestion_detail_title").textContent = suggestion.title;

        const bodyContainer = document.querySelector(".suggestion_body_text");
        if (bodyContainer) {
            bodyContainer.innerHTML = suggestion.description
                .split("\n")
                .map(para => `<p>${para}</p>`)
                .join("");
        }

        const userNameEl = document.querySelector(".user_name");
        if (userNameEl) userNameEl.textContent = suggestion.author_name;

        const categoryLabel = await getCategoryLabel(suggestion.category);
        const categoryPill = document.querySelector(".category_pill");
        if (categoryPill) categoryPill.textContent = categoryLabel;

        const voteCountEl = document.querySelector("#detailVoteCount");
        if (voteCountEl) voteCountEl.textContent = `${suggestion.votes || 0} votes`;

        const avatarEl = document.querySelector(".suggestion_meta_bar .user_avatar");
        if (avatarEl && suggestion.author_name) {
            const initials = suggestion.author_name
                .split(" ")
                .map(n => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
            avatarEl.textContent = initials || "UN";
        }

        if (suggestion.created_at) {
            const formattedDate = new Date(suggestion.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const dateEl = document.querySelector(".submission_date");
            if (dateEl) dateEl.textContent = `Submitted ${formattedDate}`;
        }

        updateStatusTagAndTracker(suggestion.status);

        if (errorContainer) errorContainer.style.display = "none";
        if (contentWrapper) contentWrapper.style.display = "block";

        const user = getCachedUser();

        const mainVoteBtn = document.getElementById("detailVoteBtn");
        if (mainVoteBtn) {
            if (!user) {
                mainVoteBtn.classList.add("disabled");
                mainVoteBtn.title = "Please log in to vote";
            } else {
                mainVoteBtn.classList.remove("disabled");
            }
        }

        const commentBoxCard = document.querySelector(".comment_box_card");
        if (commentBoxCard) {
            if (!user) {
                commentBoxCard.innerHTML = `
                    <div style="text-align: center; padding: 20px 0;">
                        <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 16px;">You must be logged in to join the discussion.</p>
                        <a href="./login.html" class="button btn-view" style="text-decoration: none; display: inline-block;">Log in to Comment</a>
                    </div>
                `;
            } else {
                const commentAvatarEl = commentBoxCard.querySelector(".user_avatar");
                const postingAsEl = commentBoxCard.querySelector(".posting_as_text");

                if (commentAvatarEl) {
                    commentAvatarEl.textContent = user.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();
                }
                if (postingAsEl) postingAsEl.textContent = `Posting as ${user.name}`;
            }
        }

        if (!user) {
            document.querySelectorAll('.comment_reply_btn').forEach(btn => {
                btn.style.display = "none";
            });
            document.querySelectorAll('.comment_vote_btn').forEach(btn => {
                btn.classList.add("disabled");
            });
        }

        if (user) {
            initReplyToggle();
        }

    } catch (error) {
        console.error("Failed to load suggestion details:", error);
        showNotFoundError("An error occurred while connecting to the server.");
    }
});



async function getCategoryLabel(categoryId) {
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

    try {
        const response = await fetch('../../shared/categories.json');
        if (!response.ok) throw new Error("Failed to load categories.json");
        const categories = await response.json();
        const found = categories.find(c => c.id === categoryId);
        return found ? found.label : (fallbackCategories[categoryId] || categoryId);
    } catch (error) {
        console.warn("Using fallback categories mapping due to fetch error.");
        return fallbackCategories[categoryId] || categoryId;
    }
}

function getStatusConfig(status) {
    const lowerStatus = (status || 'open').toLowerCase();

    if (lowerStatus === 'open') return { class: 'open', label: 'Open', stepIndex: 0 };
    if (lowerStatus === 'review') return { class: 'review', label: 'Reviewing', stepIndex: 1 };
    if (lowerStatus === 'planned') return { class: 'planned', label: 'On Agenda', stepIndex: 2 };
    if (lowerStatus === 'progress') return { class: 'progress', label: 'In Progress', stepIndex: 3 };
    if (lowerStatus === 'done') return { class: 'done', label: 'Completed', stepIndex: 4, isComplete: true };
    if (lowerStatus === 'rejected') return { class: 'rejected', label: 'Rejected', stepIndex: -1 };

    return { class: 'open', label: status, stepIndex: 0 };
}

function showNotFoundError(message) {
    const contentWrapper = document.getElementById("suggestion_content_wrapper");
    const errorContainer = document.getElementById("suggestion_error_container");
    const errorMessageText = document.getElementById("error_message_text");

    if (contentWrapper) contentWrapper.style.display = "none";
    if (errorMessageText) errorMessageText.textContent = message;
    if (errorContainer) errorContainer.style.display = "block";
}

function updateStatusTagAndTracker(status) {
    const currentStatusConfig = getStatusConfig(status);

    const topTag = document.querySelector(".suggestion_detail_tags .tag");
    if (topTag) {
        topTag.className = `tag ${currentStatusConfig.class}`;
        topTag.textContent = currentStatusConfig.label;
    }

    const trackerContainer = document.querySelector('.status_tracker_container');
    const wrapper = document.querySelector('.status_steps_wrapper');

    if (currentStatusConfig.stepIndex === -1) {
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="tracker_step_item" style="margin: 0 auto;">
                    <div class="tracker_node" style="border-color: var(--danger-text); background-color: var(--danger-bg);">
                        <span class="checkmark" style="color: var(--danger-text); font-weight: 600;">&#10006;</span>
                    </div>
                    <span class="tracker_text" style="color: var(--danger-text); font-weight: 600;">Suggestion Rejected</span>
                </div>
            `;
            wrapper.style.justifyContent = "center";
        }
        if (trackerContainer) trackerContainer.style.display = 'flex';
        return;
    }

    const trackerLabels = ['Open', 'Reviewing', 'On Agenda', 'In Progress', 'Completed'];
    const trackerTextNodes = document.querySelectorAll('.tracker_text');
    trackerTextNodes.forEach((node, index) => {
        if (trackerLabels[index]) node.textContent = trackerLabels[index];
    });

    const steps = document.querySelectorAll(".tracker_step_item");
    const connectors = document.querySelectorAll(".tracker_connector");

    steps.forEach((step, index) => {
        step.classList.remove("active", "completed");
        const node = step.querySelector(".tracker_node");

        if (node) {
            node.innerHTML = "";

            if (index < currentStatusConfig.stepIndex || (index === currentStatusConfig.stepIndex && currentStatusConfig.isComplete)) {
                step.classList.add("completed");
                node.innerHTML = '<span class="checkmark">&#10003;</span>';
            }
            else if (index === currentStatusConfig.stepIndex) {
                step.classList.add("active");
            }
        }
    });

    connectors.forEach((connector, index) => {
        connector.classList.remove("completed");
        if (index < currentStatusConfig.stepIndex) {
            connector.classList.add("completed");
        }
    });
}

function initReplyToggle() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('comment_reply_btn')) {
            const commentItem = e.target.closest('.comment_item');
            if (!commentItem) return;

            let existingReplyBox = commentItem.querySelector('.inline_reply_box');
            if (existingReplyBox) {
                existingReplyBox.remove();
                return;
            }

            document.querySelectorAll('.inline_reply_box').forEach(box => box.remove());

            const user = getCachedUser();
            const userName = user ? user.name : "User Name";
            const userInitials = userName !== "User Name" ? userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "UN";

            const replyBox = document.createElement('div');

            replyBox.className = 'comment_box_card inline_reply_box';
            replyBox.style.marginTop = '12px';
            replyBox.innerHTML = `
                <div class="comment_box_top" style="gap: 12px;">
                    <div class="user_avatar" style="width: 32px; height: 32px; font-size: 10px;">${userInitials}</div>
                    <textarea class="comment_textarea" placeholder="Write a reply..." rows="2"></textarea>
                </div>
                <div class="comment_box_footer" style="padding-left: 44px; margin-top: 10px;">
                    <span class="posting_as_text">Posting as ${userName}</span>
                    <button class="button btn-view submit_inline_reply" style="padding: 6px 14px; font-size: 13px;">Post Reply</button>
                </div>
            `;

            commentItem.appendChild(replyBox);
            replyBox.querySelector('textarea').focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('submit_inline_reply')) {
            const replyBox = e.target.closest('.inline_reply_box');
            const textarea = replyBox.querySelector('textarea');
            const replyText = textarea.value.trim();

            if (!replyText) return;

            console.log("Posted inline reply:", replyText);
            replyBox.remove();
        }
    });
}
