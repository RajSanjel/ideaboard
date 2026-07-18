import { me, logout } from "./auth.js"

const user = await me();
const navToChageElement = document.getElementById("nav__auth_dependent");
const buttonsToEnable = document.querySelectorAll(".toggle_disabled_class");
if (user) {
    const toReplaceInNav = `
            <ul class="nav_items">  
                <li>Hello, ${user.name}</li>
            </ul>
            <ul class="nav_items">
                <li><button class="button_logout" id="button_logout">Logout</button></li>
            </ul>
`
    navToChageElement.innerHTML = toReplaceInNav;


    const logoutButton = document.getElementById("button_logout");
    logoutButton.addEventListener("click", () => {
        logout()
        window.location.replace(window.location);
    });

    for (const button of buttonsToEnable) {
        button.disabled = false;
        button.classList.remove("disabled");
        button.classList.add("enabled_button");
    }
}