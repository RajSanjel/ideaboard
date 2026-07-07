import { Router } from "express";
import AuthController from "../../app/Http/Controllers/authController";
import { validateLogin, validateSignUp } from "../../validators/authValidator";

const router: Router = Router();

router.post("/register", validateSignUp, AuthController.register);
router.post("/login", validateLogin, AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.me);

export default router;
