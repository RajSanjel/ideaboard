import { Router } from "express";
import AdminController from "../../app/Http/Controllers/adminController.js";
import verifyPerms from "../../app/Http/Middleware/adminMiddleware.js";
import verifyAuth from "../../app/Http/Middleware/authMiddleware.js";

const router: Router = Router();

router.patch(
	"/suggestions/:id/status",
	verifyAuth,
	verifyPerms,
	AdminController.updateSuggestionStatus,
);
router.get("/users", verifyAuth, verifyPerms, AdminController.getUsers);
router.get("/userStats", verifyAuth, verifyPerms, AdminController.getUserStats);
router.patch(
	"/userAccess/:id/access",
	verifyAuth,
	verifyPerms,
	AdminController.updateUserAccess,
);
export default router;
