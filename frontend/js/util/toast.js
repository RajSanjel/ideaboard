export function showToast(message, type = "success") {
    let host = document.getElementById("toast_host");
    if (!host) {
        host = document.createElement("div");
        host.id = "toast_host";
        document.body.appendChild(host);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast_${type}`;
    toast.textContent = message;
    host.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast_show"));

    setTimeout(() => {
        toast.classList.remove("toast_show");
        setTimeout(() => toast.remove(), 200);
    }, 2500);
}