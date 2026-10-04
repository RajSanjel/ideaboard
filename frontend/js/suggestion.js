import API_CONFIG from "./config/api.js";
import { getCachedUser } from "./global/auth.js";
import {
    getStatusConfig,
    getCategoryLabel,
    formatDate,
    formatTimeAgo,
    getInitials
} from "./util/helpers.js";

const EDIT_WINDOW_MS = 15 * 60 * 1000;
let suggestionRecord = null;

function canEdit(createdAt) {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("refId");

    const contentWrapper = document.getElementById("suggestion_content_wrapper");
    const errorContainer = document.getElementById("suggestion_error_container");

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
        suggestionRecord = suggestion;

        document.querySelector(".suggestion_ref_id").textContent = suggestion.ref;
        document.querySelector(".suggestion_detail_title").textContent = suggestion.title;

        const bodyContainer = document.querySelector(".suggestion_body_text");
        if (bodyContainer) {
            bodyContainer.innerHTML = suggestion.description
                .split("\n")
                .map((para) => `<p>${para}</p>`)
                .join("");
        }

        const userNameEl = document.querySelector(".suggestion_meta_bar .user_name");
        if (userNameEl) userNameEl.textContent = suggestion.author_name;

        const categoryLabel = await getCategoryLabel(suggestion.category);
        const categoryPill = document.querySelector(".category_pill");
        if (categoryPill) categoryPill.textContent = categoryLabel;

        const voteCountEl = document.querySelector("#detailVoteCount");
        if (voteCountEl) voteCountEl.textContent = `${suggestion.votes || 0} upvotes`;

        const avatarEl = document.querySelector(".suggestion_meta_bar .user_avatar");
        if (avatarEl && suggestion.author_name) {
            avatarEl.textContent = getInitials(suggestion.author_name);
        }

        if (suggestion.created_at) {
            const dateEl = document.querySelector(".submission_date");
            if (dateEl) dateEl.textContent = `Submitted ${formatDate(suggestion.created_at)}`;
        }

        updateStatusTagAndTracker(suggestion.status);

        if (errorContainer) errorContainer.style.display = "none";
        if (contentWrapper) contentWrapper.style.display = "block";

        const user = getCachedUser();
        const suggestionKey = suggestion.id || suggestion.ref;

        if (user && suggestion.author_id === user.id && canEdit(suggestion.created_at)) {
            const actions = document.createElement("div");
            actions.className = "detail_actions";
            actions.innerHTML = `
                <button type="button" class="icon_button" id="edit_suggestion_btn" title="Edit">
                    <img src="./public/edit.svg" alt="Edit">
                </button>
                <button type="button" class="icon_button icon_button_danger" id="delete_suggestion_btn" title="Delete">
                    <img src="./public/trash.svg" alt="Delete">
                </button>
            `;
            document.querySelector(".suggestion_detail_header")?.appendChild(actions);

            document.getElementById("edit_suggestion_btn").addEventListener("click", () => startSuggestionEdit(suggestionKey));
            document.getElementById("delete_suggestion_btn").addEventListener("click", async () => {
                if (!canEdit(suggestionRecord.created_at)) return;
                if (!confirm("Delete this suggestion?")) return;
                const deleteResult = await api(`/${suggestionKey}`, { method: "DELETE" });
                if (deleteResult.httpCode === 200) window.location.href = "./suggestions.html";
            });
        }

        const mainVoteBtn = document.getElementById("detailVoteBtn");
        if (mainVoteBtn) {
            if (!user) {
                mainVoteBtn.classList.add("disabled");
                mainVoteBtn.title = "Please log in to upvote";
            } else {
                mainVoteBtn.classList.remove("disabled");
                mainVoteBtn.addEventListener("click", async () => {
                    const voteResult = await api(`/${suggestionKey}/vote`, { method: "POST" });
                    if (voteResult.httpCode === 200 && voteCountEl) {
                        voteCountEl.textContent = `${voteResult.data.votes} upvotes`;
                        mainVoteBtn.classList.toggle("vote_selected", voteResult.data.voted);
                    }
                });
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

                if (commentAvatarEl) commentAvatarEl.textContent = getInitials(user.name);
                if (postingAsEl) postingAsEl.textContent = `Posting as ${user.name}`;

                document.getElementById("postCommentBtn")?.addEventListener("click", async () => {
                    const textarea = commentBoxCard.querySelector(".comment_textarea");
                    const body = textarea?.value.trim();
                    if (!body) return;

                    const postResult = await postComment(suggestionKey, body);
                    if (postResult.httpCode === 201) {
                        textarea.value = "";
                        await loadComments(suggestionKey, user);
                    }
                });
            }
        }

        await loadComments(suggestionKey, user);
        initReplyToggle(suggestionKey);

        document.querySelector(".comments_thread_container")?.addEventListener("click", async (event) => {
            const deleteBtn = event.target.closest("[data-action='delete-comment']");
            if (deleteBtn) {
                const item = deleteBtn.closest(".comment_item");
                if (!confirm("Delete this comment?")) return;
                const deleteResult = await api(`/comments/${item.dataset.id}`, { method: "DELETE" });
                if (deleteResult.httpCode === 200) item.remove();
                return;
            }

            const editBtn = event.target.closest("[data-action='edit-comment']");
            if (editBtn) {
                const item = editBtn.closest(".comment_item");
                const textEl = item.querySelector(".comment_text");
                if (item.querySelector(".edit_comment_input")) return;

                const current = textEl.textContent;
                textEl.innerHTML = `
                    <textarea class="edit_comment_input" rows="3">${current}</textarea>
                    <div class="edit_actions">
                        <button type="button" class="button btn-view" data-action="save-comment">Save</button>
                        <button type="button" class="ghost_button" data-action="cancel-comment" data-original="${current.replaceAll('"', "&quot;")}">Cancel</button>
                    </div>
                `;
                return;
            }

            const cancelCommentBtn = event.target.closest("[data-action='cancel-comment']");
            if (cancelCommentBtn) {
                const item = cancelCommentBtn.closest(".comment_item");
                item.querySelector(".comment_text").textContent = cancelCommentBtn.dataset.original || "";
                return;
            }

            const saveCommentBtn = event.target.closest("[data-action='save-comment']");
            if (saveCommentBtn) {
                const item = saveCommentBtn.closest(".comment_item");
                const body = item.querySelector(".edit_comment_input").value.trim();
                if (!body) return;

                const saveResult = await api(`/comments/${item.dataset.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ body }),
                });
                if (saveResult.httpCode !== 200) return;
                item.querySelector(".comment_text").textContent = saveResult.data.body;
                return;
            }

            const btn = event.target.closest("[data-action='vote-comment']");
            if (!btn || btn.disabled) return;

            const commentId = btn.closest(".comment_item")?.dataset.id;
            const voteResult = await api(`/comments/${commentId}/vote`, { method: "POST" });
            if (voteResult.httpCode !== 200) return;

            const countEl = btn.querySelector(".upvote_count");
            if (countEl) countEl.textContent = String(voteResult.data.votes);
            btn.classList.toggle("vote_selected", voteResult.data.voted);
        });
    } catch (error) {
        console.error("Failed to load suggestion details:", error);
        showNotFoundError("An error occurred while connecting to the server.");
    }
});

async function startSuggestionEdit(suggestionKey) {
    if (!canEdit(suggestionRecord.created_at)) return;

    const titleEl = document.querySelector(".suggestion_detail_title");
    const bodyEl = document.querySelector(".suggestion_body_text");
    const pill = document.querySelector(".category_pill");
    if (!titleEl || !bodyEl || titleEl.querySelector("input")) return;

    const previousLabel = pill?.textContent || suggestionRecord.category;
    const categories = await fetch("../shared/categories.json")
        .then((resp) => resp.json())
        .catch(() => []);

    const options = categories.map((category) => {
        const selected = category.id === suggestionRecord.category || category.label === suggestionRecord.category ? "selected" : "";
        return `<option value="${category.id}" ${selected}>${category.label}</option>`;
    }).join("");

    titleEl.innerHTML = `<input class="edit_title_input" value="${titleEl.textContent.replaceAll('"', "&quot;")}">`;
    if (pill) {
        pill.outerHTML = `<select class="edit_category_select" id="edit_category_select">${options}</select>`;
    }

    bodyEl.innerHTML = `
        <textarea class="edit_body_input" rows="6">${suggestionRecord.description || ""}</textarea>
        <div class="edit_actions">
            <button type="button" class="button btn-view" id="save_suggestion_btn">Save</button>
            <button type="button" class="ghost_button" id="cancel_suggestion_btn">Cancel</button>
        </div>
    `;

    document.getElementById("cancel_suggestion_btn").addEventListener("click", () => {
        titleEl.textContent = suggestionRecord.title;
        bodyEl.innerHTML = (suggestionRecord.description || "")
            .split("\n")
            .map((para) => `<p>${para}</p>`)
            .join("");

        const select = document.getElementById("edit_category_select");
        if (select) select.outerHTML = `<span class="category_pill">${previousLabel}</span>`;
    });

    document.getElementById("save_suggestion_btn").addEventListener("click", async () => {
        if (!canEdit(suggestionRecord.created_at)) return;

        const nextTitle = titleEl.querySelector("input").value.trim();
        const nextBody = bodyEl.querySelector("textarea").value.trim();
        const nextCategory = document.getElementById("edit_category_select")?.value;
        if (!nextTitle || !nextBody || !nextCategory) return;

        const result = await api(`/${suggestionKey}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: nextTitle,
                description: nextBody,
                category: nextCategory,
            }),
        });
        if (result.httpCode !== 200) return;

        suggestionRecord = result.data;
        titleEl.textContent = result.data.title;
        bodyEl.innerHTML = result.data.description.split("\n").map((para) => `<p>${para}</p>`).join("");

        const select = document.getElementById("edit_category_select");
        const label = categories.find((category) => category.id === result.data.category)?.label || result.data.category;
        if (select) select.outerHTML = `<span class="category_pill">${label}</span>`;
    });
}

async function api(path, options = {}) {
    const resp = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });
    return resp.json();
}

async function postComment(suggestionKey, body, parentId) {
    return api(`/${suggestionKey}/comments`, {
        method: "POST",
        body: JSON.stringify(parentId ? { body, parentId } : { body }),
    });
}

function upvoteButton(votes, disabled) {
    return `
        <button type="button" class="comment_vote_btn ${disabled ? "disabled" : ""}" data-action="vote-comment" ${disabled ? "disabled" : ""}>
            <img src="./public/vote.svg" alt="" width="12" height="12">
            Upvote
            <span class="upvote_count">${votes || 0}</span>
        </button>
    `;
}

function commentNode(comment, replies, user) {
    const isAuthor = user && comment.author_id === user.id;
    const canChange = isAuthor && canEdit(comment.created_at);
    const replyHtml = replies.map((reply) => commentNode(reply, [], user)).join("");

    return `
        <article class="comment_item ${comment.parent_id ? "nested" : ""}" data-id="${comment.id}">
            <div class="comment_main_content">
                <div class="user_avatar">${getInitials(comment.author_name)}</div>
                <div class="comment_content_body">
                    <div class="comment_header_meta">
                        <span class="user_name">${comment.author_name || "User"}</span>
                        <span class="comment_time">${formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <p class="comment_text">${comment.body}</p>
                    <div class="comment_actions">
                        ${upvoteButton(comment.votes, !user || isAuthor)}
                        ${user && !comment.parent_id ? `<button type="button" class="comment_reply_btn" data-action="reply">Reply</button>` : ""}
                        ${canChange ? `<button type="button" class="comment_reply_btn" data-action="edit-comment">Edit</button>` : ""}
                        ${canChange ? `<button type="button" class="comment_reply_btn" data-action="delete-comment">Delete</button>` : ""}
                    </div>
                    ${replyHtml ? `<div class="comment_replies_list">${replyHtml}</div>` : ""}
                </div>
            </div>
        </article>
    `;
}

function renderComments(rows, user) {
    const thread = document.querySelector(".comments_thread_container");
    if (!thread) return;

    const repliesByParent = new Map();
    rows.forEach((row) => {
        if (!row.parent_id) return;
        const list = repliesByParent.get(row.parent_id) || [];
        list.push(row);
        repliesByParent.set(row.parent_id, list);
    });

    const top = rows.filter((row) => !row.parent_id);
    thread.innerHTML = top.length
        ? top.map((row) => commentNode(row, repliesByParent.get(row.id) || [], user)).join("")
        : `<p class="comment_text">No comments yet.</p>`;
}

async function loadComments(suggestionKey, user) {
    const result = await api(`/${suggestionKey}/comments`);
    if (result.httpCode === 200) renderComments(result.data || [], user);
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

    const trackerContainer = document.querySelector(".status_tracker_container");
    const wrapper = document.querySelector(".status_steps_wrapper");

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
        if (trackerContainer) trackerContainer.style.display = "flex";
        return;
    }

    const trackerLabels = ["Open", "Reviewing", "On Agenda", "In Progress", "Completed"];
    document.querySelectorAll(".tracker_text").forEach((node, index) => {
        if (trackerLabels[index]) node.textContent = trackerLabels[index];
    });

    const steps = document.querySelectorAll(".tracker_step_item");
    const connectors = document.querySelectorAll(".tracker_connector");

    steps.forEach((step, index) => {
        step.classList.remove("active", "completed");
        const node = step.querySelector(".tracker_node");
        if (!node) return;

        node.innerHTML = "";
        if (index < currentStatusConfig.stepIndex || (index === currentStatusConfig.stepIndex && currentStatusConfig.isComplete)) {
            step.classList.add("completed");
            node.innerHTML = '<span class="checkmark">&#10003;</span>';
        } else if (index === currentStatusConfig.stepIndex) {
            step.classList.add("active");
        }
    });

    connectors.forEach((connector, index) => {
        connector.classList.remove("completed");
        if (index < currentStatusConfig.stepIndex) connector.classList.add("completed");
    });
}

function initReplyToggle(suggestionKey) {
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("comment_reply_btn") && e.target.dataset.action === "reply") {
            const commentItem = e.target.closest(".comment_item");
            if (!commentItem) return;

            const existingReplyBox = commentItem.querySelector(".inline_reply_box");
            if (existingReplyBox) {
                existingReplyBox.remove();
                return;
            }

            document.querySelectorAll(".inline_reply_box").forEach((box) => box.remove());

            const user = getCachedUser();
            const userName = user ? user.name : "User";
            const replyBox = document.createElement("div");
            replyBox.className = "comment_box_card inline_reply_box";
            replyBox.style.marginTop = "12px";
            replyBox.innerHTML = `
                <div class="comment_box_top" style="gap: 12px;">
                    <div class="user_avatar" style="width: 32px; height: 32px; font-size: 10px;">${getInitials(userName)}</div>
                    <textarea class="comment_textarea" placeholder="Write a reply..." rows="2"></textarea>
                </div>
                <div class="comment_box_footer" style="padding-left: 44px; margin-top: 10px;">
                    <span class="posting_as_text">Posting as ${userName}</span>
                    <button type="button" class="button btn-view submit_inline_reply" style="padding: 6px 14px; font-size: 13px;">Post Reply</button>
                </div>
            `;
            commentItem.querySelector(".comment_content_body").appendChild(replyBox);
            replyBox.querySelector("textarea").focus();
            return;
        }

        if (e.target.classList.contains("submit_inline_reply")) {
            const replyBox = e.target.closest(".inline_reply_box");
            const commentItem = e.target.closest(".comment_item");
            const body = replyBox.querySelector("textarea").value.trim();
            if (!body) return;

            const postResult = await postComment(suggestionKey, body, commentItem.dataset.id);
            if (postResult.httpCode !== 201) return;

            replyBox.remove();

            let replies = commentItem.querySelector(".comment_replies_list");
            if (!replies) {
                replies = document.createElement("div");
                replies.className = "comment_replies_list";
                commentItem.querySelector(".comment_content_body").appendChild(replies);
            }

            replies.insertAdjacentHTML(
                "beforeend",
                commentNode(postResult.data, [], getCachedUser())
            );
        }
    });
}