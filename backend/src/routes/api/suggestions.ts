import { Router } from "express";
import verifyAuth from "../../app/Http/Middleware/authMiddleware.js";
import { validateSuggestion } from "../../validators/suggestionValidator.js";
import SuggestionController from "../../app/Http/Controllers/suggestionsController.js";

const router: Router = Router();

router.post("/", verifyAuth, validateSuggestion, SuggestionController.create);
router.get("/", SuggestionController.getAll);

export default router;
