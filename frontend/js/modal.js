import API_CONFIG from "./config/api.js";
import { getCachedUser } from './global/auth.js';

async function getCategories() {
    try {
        const response = await fetch('../../shared/categories.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not load categories:", error);
        return [];
    }
}
function buildModalHTML(categories, user) {
    let categoryOptions = '<option value="" disabled selected>Select Category</option>';
    categories.forEach(category => {
        categoryOptions += `<option value="${category.id}">${category.label}</option>`;
    });

    const authorName = user ? user.name : 'Anonymous';

    return `
        <div class="modal-content">
            <div class="modal-body">
                <h2 class="modal-title">Submit a suggestion</h2>
                <p class="modal-subtitle">Posts go to the college administration and are visible to the<br>IdeaBoard community.</p>

                <form id="suggestionForm">
                    <div class="form-group">
                        <label for="title">Title</label>
                        <input type="text" id="title" name="title" placeholder="A short summary" />
                        <div class="error-message" id="title-error"></div>
                        <span class="help-text">Keep it short and specific.</span>
                    </div>

                    <div class="form-group">
                        <label for="details">Details</label>
                        <textarea id="details" name="details" placeholder="Provide the description for the suggestion mentioned."></textarea>
                        <div class="error-message" id="details-error"></div>
                        <span class="help-text">Plain text. Up to 6000 characters.</span>
                    </div>

                    <div class="form-group">
                        <label for="category">Category</label>
                        <div class="select-wrapper">
                            <select id="category" name="category">
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            
           <div class="modal-footer">
                <div class="footer-text">
                    Posting as <strong>${authorName}</strong>. Your name is visible to other readers.
                </div>
                <div class="footer-actions">
                    <button type="button" id="closeModal" class="btn-cancel">Cancel</button>
                    <button type="submit" form="suggestionForm" id="submitBtn" class="btn-submit disabled" disabled>Submit suggestion</button>
                </div>
            </div>
        </div>
    `;
}

const FormValidator = {
    clearError: (inputId) => {
        const inputElement = document.getElementById(inputId);
        const errorElement = document.getElementById(`${inputId}-error`);
        if (inputElement) inputElement.classList.remove('invalid');
        if (errorElement) errorElement.style.display = 'none';
    },

    showError: (inputId, message) => {
        const inputElement = document.getElementById(inputId);
        const errorElement = document.getElementById(`${inputId}-error`);
        if (inputElement) inputElement.classList.add('invalid');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },

    isTitleValid: (val) => val.length >= 5 && val.length < 200,
    isDetailsValid: (val) => val.length >= 30 && val.length <= 6000,

    validateTitle: (inputElement) => {
        const titleVal = inputElement.value.trim();
        FormValidator.clearError('title');

        if (!titleVal) {
            FormValidator.showError('title', 'Please provide a title for your suggestion.');
            return false;
        }
        if (titleVal.length < 5) {
            FormValidator.showError('title', 'Title must be at least 5 characters long.');
            return false;
        }
        if (titleVal.length >= 200) {
            FormValidator.showError('title', 'Title must be less than 200 characters.');
            return false;
        }
        return true;
    },

    validateDetails: (inputElement) => {
        const detailsVal = inputElement.value.trim();
        FormValidator.clearError('details');

        if (!detailsVal) {
            FormValidator.showError('details', 'Please provide the details of your suggestion.');
            return false;
        }
        if (detailsVal.length < 30) {
            FormValidator.showError('details', 'Details must be at least 30 characters.');
            return false;
        }
        if (detailsVal.length > 6000) {
            FormValidator.showError('details', 'Details cannot be more than 6000 characters.');
            return false;
        }
        return true;
    }
};

function setupModalEvents(modal) {
    const form = document.getElementById('suggestionForm');
    const closeBtn = document.getElementById('closeModal');
    const submitBtn = document.getElementById('submitBtn');
    const titleInput = document.getElementById('title');
    const detailsInput = document.getElementById('details');

    // Dynamic Button State Logic 
    const checkButtonState = () => {
        const titleVal = titleInput.value.trim();
        const detailsVal = detailsInput.value.trim();

        const isValid = FormValidator.isTitleValid(titleVal) && FormValidator.isDetailsValid(detailsVal);

        // Toggle disabled state
        submitBtn.disabled = !isValid;
        submitBtn.classList.toggle('disabled', !isValid);
    };

    titleInput.addEventListener('input', () => {
        checkButtonState();
        if (titleInput.classList.contains('invalid') && FormValidator.isTitleValid(titleInput.value.trim())) {
            FormValidator.clearError('title');
        }
    });

    detailsInput.addEventListener('input', () => {
        checkButtonState();
        if (detailsInput.classList.contains('invalid') && FormValidator.isDetailsValid(detailsInput.value.trim())) {
            FormValidator.clearError('details');
        }
    });
    titleInput.addEventListener('blur', () => FormValidator.validateTitle(titleInput));
    detailsInput.addEventListener('blur', () => FormValidator.validateDetails(detailsInput));

    const closeHandler = () => closeAndClearModal(modal);
    closeBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHandler();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (submitBtn.disabled) return;

        const isTitleValid = FormValidator.validateTitle(titleInput);
        const isDetailsValid = FormValidator.validateDetails(detailsInput);

        if (isTitleValid && isDetailsValid) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            submitSuggestion(data, modal);
        }
    });
}

async function submitSuggestion(formData, modalElement) {

    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.SUGGESTIONS_ENDPOINT}`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData),
            credentials: "include"
        });

        const responseData = await resp.json();

        if (responseData.httpCode === 201) {
            const newRefId = responseData.data.ref;

            const modalContent = modalElement.querySelector('.modal-content');

            modalContent.innerHTML = `
                <div class="success_message_container">
                    <h3>Success!</h3>
                    <p>Your suggestion was added successfully.</p>
                    <p class="success_message_ref">
                        Your reference ID is <strong>${newRefId}</strong>
                    </p>
                    
                    <div class="success_modal_actions">
                        <a href="/frontend/suggestion.html?refId=${newRefId}" class="btn-submit">
                            View Suggestion
                        </a>
                        <button id="closeModalSuccessBtn" class="btn-cancel">
                            Close
                        </button>
                    </div>
                </div>
            `;

            document.getElementById("closeModalSuccessBtn").addEventListener("click", () => {
                closeAndClearModal(modalElement);
            });
        } else {
            console.error("Server rejected submission:", responseData.message);
        }
    } catch (error) {
        console.error("Submission failed:", error);
    }
}
function closeAndClearModal(modalElement) {
    modalElement.classList.remove('show');
    modalElement.innerHTML = '';
    document.body.style.overflow = '';
}

async function showSuggestionModal() {
    const modal = document.getElementById('modal');

    document.body.style.overflow = 'hidden';

    const categories = await getCategories();
    const user = getCachedUser();


    modal.innerHTML = buildModalHTML(categories, user);
    modal.classList.add('show');

    setupModalEvents(modal);
}

document.addEventListener("DOMContentLoaded", () => {
    const triggerBtns = document.querySelectorAll(".toggle_disabled_class");

    triggerBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            showSuggestionModal();
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("modal");
            if (modal && modal.classList.contains("show")) {
                closeAndClearModal(modal);
            }
        }
    });
});
