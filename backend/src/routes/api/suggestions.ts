import { Router } from "express";
import verifyAuth from "../../app/Http/Middleware/authMiddleware.js";
import { validateSuggestion } from "../../validators/suggestionValidator.js";
import SuggestionController from "../../app/Http/Controllers/suggestionsController.js";
import CommentController from "../../app/Http/Controllers/commentContoller.js";
import VoteController from "../../app/Http/Controllers/voteController.js";
const router: Router = Router();

router.post("/", verifyAuth, validateSuggestion, SuggestionController.create);
router.get("/", SuggestionController.getAll);
router.get("/stats", SuggestionController.getStats);
router.get("/detail", SuggestionController.getByref);
router.patch("/:id", verifyAuth, SuggestionController.update);
router.delete("/:id", verifyAuth, SuggestionController.remove);

router.post("/:id/vote", verifyAuth, VoteController.toggleSuggestion);
router.post("/comments/:id/vote", verifyAuth, VoteController.toggleComment);

router.patch("/comments/:id", verifyAuth, CommentController.update);
router.delete("/comments/:id", verifyAuth, CommentController.remove);
router.get("/:id/comments", CommentController.list);
router.post("/:id/comments", verifyAuth, CommentController.create);

export default router;
