export function showConfirmModal({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDanger = false,
    onConfirm,
    onCancel
}) {
    const modal = document.getElementById("modal");
    if (!modal) return;

    document.body.style.overflow = "hidden";

    modal.innerHTML = `
        <div class="modal_content_confirm">
            <div class="confirm_modal_body">
                <h3 class="confirm_modal_title">${title}</h3>
                <p class="confirm_modal_message">${message}</p>
            </div>
            <div class="confirm_modal_footer">
                <button type="button" class="btn_cancel_confirm" data-action="cancel">
                    ${cancelLabel}
                </button>
                <button type="button" class="btn_confirm ${isDanger ? "danger" : ""}" data-action="confirm">
                    ${confirmLabel}
                </button>
            </div>
        </div>
    `;

    modal.classList.add("show");

    const close = () => {
        modal.classList.remove("show");
        modal.innerHTML = "";
        document.body.style.overflow = "";
    };

    modal.querySelector('[data-action="confirm"]').addEventListener("click", () => {
        close();
        if (typeof onConfirm === "function") onConfirm();
    });

    modal.querySelector('[data-action="cancel"]').addEventListener("click", () => {
        close();
        if (typeof onCancel === "function") onCancel();
    });

    // Click outside to cancel
    modal.addEventListener("click", function handler(e) {
        if (e.target === modal) {
            close();
            if (typeof onCancel === "function") onCancel();
            modal.removeEventListener("click", handler);
        }
    });
}