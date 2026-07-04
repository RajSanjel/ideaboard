import { Router } from "express";
import AuthController from "../../app/Http/Controllers/authController";
import { validateSignUp } from "../../validators/authValidator";

const router: Router = Router();

router.post("/register", validateSignUp, AuthController.register);

export default router;
