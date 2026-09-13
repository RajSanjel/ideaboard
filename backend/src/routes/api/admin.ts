import { Router } from "express";
import AdminController from "../../app/Http/Controllers/adminController.js";
import verifyPerms from "../../app/Http/Middleware/adminMiddleware.js";

const router: Router = Router();

router.patch(
	"/suggestions/:id/status",
	verifyPerms,
	AdminController.updateSuggestionStatus,
);

export default router;
