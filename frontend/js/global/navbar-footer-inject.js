import { me, logout } from "./auth.js";

async function initLayout() {
    const user = await me();

    const navbarContainer = document.getElementById("navbar_container");
    const footerContainer = document.getElementById("footer_container");
    const buttonsToEnable = document.querySelectorAll(".toggle_disabled_class");

    const logoHTML = `
        <a href="index.html" class="logo" style="text-decoration: none; display: flex; align-items: center;">
            <img src="./public/logo.svg" alt="IdeaBoard Logo" style="height: 35px; width: auto; display: block;" />
        </a>
    `;

    if (navbarContainer) {
        const authNavHTML = user
            ? `
                <ul class="nav_items">  
                    <li class="nav_user_greeting">Hello, ${user.name || 'User'}</li>
                    <li><button class="button_logout" id="button_logout">Logout</button></li>
                </ul>
            `
            : `
                <ul class="nav_items">
                    <li><a href="./login.html">Sign in</a></li>
                </ul>
            `;

        navbarContainer.innerHTML = `
            <nav>
                <div class="left">
                    ${logoHTML}
                    <ul class="nav_items">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="./suggestions.html">Suggestion</a></li>
                    </ul>
                </div>
                <div class="left" id="nav__auth_dependent">
                    ${authNavHTML}
                </div>
            </nav>
        `;
    }

    if (footerContainer) {
        const authFooterLinks = user
            ? `
                <li class="footer_link"><a href="./suggestions.html">Suggestion Board</a></li>
                <li class="footer_link"><a href="./index.html#guideline">Guidelines to Post</a></li>
            `
            : `
                <li class="footer_link"><a href="./suggestions.html">Suggestion Board</a></li>
                <li class="footer_link"><a href="./login.html">Sign in</a></li>
                <li class="footer_link"><a href="./signup.html">Create account</a></li>
            `;

        footerContainer.innerHTML = `
            <footer class="footer">
                <div class="footer_first">
                    ${logoHTML}
                    <p class="footer_text">Suggestion board for ABC College. Built for transparent college decisions.</p>
                </div>
                <div class="footer_middle">
                    <ul class="footer_list">
                        <li class="footer_title">Explore</li>
                        <span class="footer_items" id="footer_explore_container">
                            ${authFooterLinks}
                        </span>
                    </ul>
                </div>
                <div class="footer_last">
                    <ul class="footer_list">
                        <li class="footer_title">Contact</li>
                        <span class="footer_items">
                            <li class="footer_info">ABC College</li>
                            <li class="footer_info">info@ideaboard.edu.np</li>
                            <li class="footer_info">+977 9841098036</li>
                        </span>
                    </ul>
                </div>
            </footer>
            <p class="footer_copyright">
                IdeaBoard · 2026 · All suggestions are public within the college community.
            </p>
        `;
    }

    const currentPath = window.location.pathname;
    document.querySelectorAll("nav .nav_items a").forEach(link => {
        const href = link.getAttribute("href");
        if (href && (currentPath.endsWith(href.replace("./", "")) || (href === "index.html" && currentPath === "/"))) {
            link.parentElement.classList.add("active");
        } else {
            link.parentElement.classList.remove("active");
        }
    });

    if (user) {
        const logoutButton = document.getElementById("button_logout");
        if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
                await logout();
                window.location.replace(window.location.href);
            });
        }

        buttonsToEnable.forEach(button => {
            button.disabled = false;
            button.classList.remove("disabled");
            button.classList.add("enabled_button");
        });
    }
}

document.addEventListener("DOMContentLoaded", initLayout);