import { Router } from "express";
import verifyAuth from "../../app/Http/Middleware/authMiddleware.js";
import VoteController from "../../app/Http/Controllers/voteController.js";

const router: Router = Router();

router.post("/:id", verifyAuth, VoteController.toggleSuggestion);
router.post("/comments/:id", verifyAuth, VoteController.toggleComment);

export default router;
