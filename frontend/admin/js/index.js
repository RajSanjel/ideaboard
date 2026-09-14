import API_CONFIG from "../../js/config/api.js";
import { me, logout } from "../../js/global/auth.js";
import { formatDate, getCategoryLabel } from "../../js/util/helpers.js";
const STATUS_LABELS = {
    open: "Open",
    review: "Reviewing",
    planned: "On agenda",
    progress: "In progress",
    done: "Done",
    rejected: "Rejected",
};

const state = {
    page: 1,
    limit: 8,
    search: "",
    filter: "all",
    sort: "most_votes",
};

const suggestionTbody = document.getElementById("suggestion_tbody");
const suggestionCount = document.getElementById("suggestion_count");
const searchInput = document.getElementById("search_suggestions");
const sortSelect = document.getElementById("sort_select");
const pageInfo = document.querySelector(".page_info");
const pageCurrent = document.querySelector(".page_current");
const prevBtn = document.querySelector(".page_controls .page_btn:first-child");
const nextBtn = document.querySelector(".page_controls .page_btn:last-child");

function statusOptions(current) {
    return Object.entries(STATUS_LABELS)
        .map(([value, label]) => {
            const selected = value === current ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
}

async function rowTemplate(item) {
    const status = item.status || "open";
    const category = await getCategoryLabel(item.category);
    return `
        <tr data-id="${item.id}" data-ref="${item.ref}" data-status="${status}">
            <td>
                <div class="suggestion_cell">
                    <span class="suggestion_title">${item.title ?? ""}</span>
                    <span class="suggestion_meta">${item.ref ?? ""}</span>
                </div>
            </td>
            <td class="vote_count">${item.votes ?? 0}</td>
            <td>
                <label class="status_select_wrap" data-status="${status}">
                    <select class="status_select" name="status">
                        ${statusOptions(status)}
                    </select>
                    <img src="./public/chevron.svg" alt="" class="status_chevron">
                </label>
            </td>
            <td>${category ?? ""}</td>
            <td>
                <div class="poster_cell">
                    <span class="poster_name">${item.author_name ?? ""}</span>
                    <span class="poster_role">${item.author_role ?? ""}</span>
                </div>
            </td>
            <td class="date_cell">${formatDate(item.created_at)}</td>
            <td>
                <div class="row_actions">
                    <a class="action_open" href="../suggestion.html?refId=${item.ref}" target="_blank">Open</a>
                </div>
            </td>
        </tr>
    `;
}

function buildListUrl() {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("limit", String(state.limit));

    if (state.search) params.set("search", state.search);

    if (state.filter === "needs_response") {
        params.set("status", "open");
    }

    if (state.filter === "high_interest" || state.sort === "most_votes") {
        params.set("sort", "most_votes");
    }

    return `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}?${params}`;
}

async function fetchJson(url, options = {}) {
    const resp = await fetch(url, {
        credentials: "include",
        ...options,
    });
    return resp.json();
}

function renderStats(stats) {
    const map = {
        open: stats.open,
        planned: stats.planned,
        progress: stats.in_progress,
        done: stats.completed,
    };

    Object.entries(map).forEach(([key, value]) => {
        const el = document.querySelector(`[data-stat="${key}"] .stat_value`);
        if (el) el.textContent = String(value ?? 0);
    });
}

function renderPagination(meta) {
    const total = meta?.total ?? 0;
    const page = meta?.page ?? 1;
    const limit = meta?.limit ?? state.limit;
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    if (pageInfo) pageInfo.textContent = `Showing ${start}–${end} of ${total}`;
    if (pageCurrent) pageCurrent.textContent = `Page ${page} of ${pageCount}`;

    if (prevBtn) {
        prevBtn.disabled = page <= 1;
        prevBtn.classList.toggle("disabled", page <= 1);
    }
    if (nextBtn) {
        nextBtn.disabled = page >= pageCount;
        nextBtn.classList.toggle("disabled", page >= pageCount);
    }
}

async function loadStats() {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}/stats`;
    const result = await fetchJson(url);
    if (result.httpCode === 200) renderStats(result.data);
}

async function loadCount() {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}?page=1&limit=1`;
    const result = await fetchJson(url);
    if (result.httpCode === 200 && suggestionCount) {
        suggestionCount.textContent = String(result.meta?.total ?? 0);
    }
}

async function loadSuggestions() {
    const result = await fetchJson(buildListUrl());
    if (result.httpCode !== 200) {
        suggestionTbody.innerHTML = "";
        return;
    }

    const rows = result.data ?? [];
    const html = await Promise.all(rows.map(rowTemplate));
    suggestionTbody.innerHTML = html.join("");
    renderPagination(result.meta);
}

async function onStatusChange(event) {
    const select = event.target;
    if (!select.classList.contains("status_select")) return;

    const row = select.closest("tr");
    const wrap = select.closest(".status_select_wrap");
    const id = row?.dataset.id;
    const nextStatus = select.value;
    const prevStatus = wrap?.dataset.status;

    wrap.dataset.status = nextStatus;
    row.dataset.status = nextStatus;

    const url = `${API_CONFIG.BASE_URL}/api/admin/suggestions/${id}/status`;
    const result = await fetchJson(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
    });

    if (result.httpCode !== 200) {
        select.value = prevStatus;
        wrap.dataset.status = prevStatus;
        row.dataset.status = prevStatus;
        return;
    }

    loadStats();
}

function exportCsv() {
    const rows = [...suggestionTbody.querySelectorAll("tr")];
    const header = ["ref", "title", "votes", "status", "category", "posted_by", "role", "submitted"];
    const lines = [header.join(",")];

    rows.forEach((row) => {
        const cols = [
            row.dataset.ref,
            row.querySelector(".suggestion_title")?.textContent,
            row.querySelector(".vote_count")?.textContent,
            row.dataset.status,
            row.children[3]?.textContent,
            row.querySelector(".poster_name")?.textContent,
            row.querySelector(".poster_role")?.textContent,
            row.querySelector(".date_cell")?.textContent,
        ].map((value) => {
            const text = String(value ?? "").trim();
            return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        });
        lines.push(cols.join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ideaboard-suggestions.csv";
    link.click();
    URL.revokeObjectURL(url);
}

function wireUi() {
    document.getElementById("filter_tabs")?.addEventListener("click", (event) => {
        const tab = event.target.closest(".filter_tab");
        if (!tab) return;
        document.querySelectorAll(".filter_tab").forEach((el) => el.classList.remove("tab_selected"));
        tab.classList.add("tab_selected");
        state.filter = tab.dataset.filter;
        state.page = 1;
        loadSuggestions();
    });

    sortSelect?.addEventListener("change", () => {
        state.sort = sortSelect.value === "votes_desc" ? "most_votes" : "newest";
        state.page = 1;
        loadSuggestions();
    });

    let searchTimer;
    searchInput?.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = searchInput.value.trim();
            state.page = 1;
            loadSuggestions();
        }, 300);
    });

    prevBtn?.addEventListener("click", () => {
        if (state.page > 1) {
            state.page -= 1;
            loadSuggestions();
        }
    });

    nextBtn?.addEventListener("click", () => {
        state.page += 1;
        loadSuggestions();
    });

    suggestionTbody?.addEventListener("change", onStatusChange);
    document.getElementById("export_csv_btn")?.addEventListener("click", exportCsv);
    document.getElementById("sign_out_btn")?.addEventListener("click", async () => {
        await logout();
        window.location.replace("../login.html");
    });
}

async function init() {
    const user = await me();
    if (!user || !(user.isAdmin || user.isStaff)) {
        window.location.replace("../index.html");
        return;
    }

    const nameEl = document.querySelector(".sidebar_user .user_name");
    const roleEl = document.querySelector(".sidebar_user .user_role");
    if (nameEl) nameEl.textContent = user.name || "User";
    if (roleEl) roleEl.textContent = user.role || (user.isAdmin ? "Admin" : "Staff");

    wireUi();
    await Promise.all([loadCount(), loadStats(), loadSuggestions()]);
}

document.addEventListener("DOMContentLoaded", init);