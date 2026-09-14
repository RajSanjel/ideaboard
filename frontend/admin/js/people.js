import API_CONFIG from "../../js/config/api.js";
import { me, logout } from "../../js/global/auth.js";

const ADMIN_BASE = `${API_CONFIG.BASE_URL}/api/admin`;
const SUGGESTIONS_URL = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}`;

const ACCESS_LABELS = {
    admin: "Admin",
    staff: "Staff",
    member: "Member",
};

const state = {
    page: 1,
    limit: 10,
    filter: "all",
    search: "",
};

let currentUser = null;

const peopleTbody = document.getElementById("people_tbody");
const searchInput = document.getElementById("people_search");
const pageInfo = document.querySelector(".page_info");
const pageCurrent = document.querySelector(".page_current");
const prevBtn = document.querySelector(".page_controls .page_btn:first-child");
const nextBtn = document.querySelector(".page_controls .page_btn:last-child");

async function fetchJson(url, options = {}) {
    const resp = await fetch(url, {
        credentials: "include",
        ...options,
    });
    return resp.json();
}

function accessOptions(current) {
    return Object.entries(ACCESS_LABELS)
        .map(([value, label]) => {
            const selected = value === current ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
}

function rowTemplate(person) {
    const access = person.access || "member";
    const canEdit = Boolean(currentUser?.isAdmin);
    const disabled = canEdit ? "" : "disabled";

    return `
        <tr data-id="${person.id}" data-access="${access}">
            <td>
                <div class="poster_cell">
                    <span class="poster_name">${person.name ?? ""}</span>
                    <span class="poster_role">${person.role ?? ""}</span>
                </div>
            </td>
            <td><span class="role_chip" data-role="${access}">${ACCESS_LABELS[access]}</span></td>
            <td>${person.email ?? ""}</td>
            <td>
                <select class="access_select" ${disabled}>
                    ${accessOptions(access)}
                </select>
            </td>
            <td>
                <div class="row_actions">
                    ${canEdit && access !== "member"
            ? `<button type="button" class="action_delete" data-action="revoke">Revoke Access</button>`
            : ""
        }
                </div>
            </td>
        </tr>
    `;
}

function buildUsersUrl() {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("limit", String(state.limit));
    if (state.filter && state.filter !== "all") params.set("filter", state.filter);
    if (state.search) params.set("search", state.search);
    return `${ADMIN_BASE}/users?${params}`;
}

function renderStats(stats) {
    const map = {
        admins: stats.admins,
        staff: stats.staff,
        people: stats.people,
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
    const result = await fetchJson(`${ADMIN_BASE}/userStats`);
    if (result.httpCode === 200) renderStats(result.data);
}

async function loadCount() {
    const result = await fetchJson(`${SUGGESTIONS_URL}?page=1&limit=1`);
    const badge = document.getElementById("suggestion_count");
    if (result.httpCode === 200 && badge) {
        badge.textContent = String(result.meta?.total ?? 0);
    }
}

async function loadPeople() {
    const result = await fetchJson(buildUsersUrl());
    if (result.httpCode !== 200) {
        peopleTbody.innerHTML = "";
        return;
    }
    peopleTbody.innerHTML = (result.data ?? []).map(rowTemplate).join("");
    renderPagination(result.meta);
}

async function setAccess(id, access) {
    return fetchJson(`${ADMIN_BASE}/userAccess/${id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access }),
    });
}

async function onAccessChange(event) {
    const select = event.target;
    if (!select.classList.contains("access_select")) return;

    const row = select.closest("tr");
    const prev = row.dataset.access;
    const next = select.value;

    const result = await setAccess(row.dataset.id, next);
    if (result.httpCode !== 200) {
        select.value = prev;
        return;
    }

    await Promise.all([loadPeople(), loadStats()]);
}

async function onRevoke(event) {
    const btn = event.target.closest("[data-action='revoke']");
    if (!btn) return;

    const row = btn.closest("tr");
    const result = await setAccess(row.dataset.id, "member");
    if (result.httpCode === 200) {
        await Promise.all([loadPeople(), loadStats()]);
    }
}

function wireUi() {
    document.getElementById("people_tabs")?.addEventListener("click", (event) => {
        const tab = event.target.closest(".filter_tab");
        if (!tab) return;
        document.querySelectorAll(".filter_tab").forEach((el) => el.classList.remove("tab_selected"));
        tab.classList.add("tab_selected");
        state.filter = tab.dataset.filter;
        state.page = 1;
        loadPeople();
    });

    let searchTimer;
    searchInput?.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = searchInput.value.trim();
            state.page = 1;
            loadPeople();
        }, 300);
    });

    prevBtn?.addEventListener("click", () => {
        if (state.page > 1) {
            state.page -= 1;
            loadPeople();
        }
    });

    nextBtn?.addEventListener("click", () => {
        state.page += 1;
        loadPeople();
    });

    peopleTbody?.addEventListener("change", onAccessChange);
    peopleTbody?.addEventListener("click", onRevoke);

    document.getElementById("sign_out_btn")?.addEventListener("click", async () => {
        await logout();
        window.location.replace("../login.html");
    });
}

async function init() {
    currentUser = await me();
    if (!currentUser || !(currentUser.isAdmin || currentUser.isStaff)) {
        window.location.replace("../index.html");
        return;
    }

    const nameEl = document.querySelector(".sidebar_user .user_name");
    const roleEl = document.querySelector(".sidebar_user .user_role");
    if (nameEl) nameEl.textContent = currentUser.name || "User";
    if (roleEl) {
        roleEl.textContent =
            currentUser.role || (currentUser.isAdmin ? "Admin" : "Staff");
    }

    wireUi();
    await Promise.all([loadCount(), loadStats(), loadPeople()]);
}

document.addEventListener("DOMContentLoaded", init);