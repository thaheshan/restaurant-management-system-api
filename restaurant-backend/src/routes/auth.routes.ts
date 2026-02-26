mport { Router } from "express";
import { register, login, refreshToken, logout, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { registerValidator, loginValidator } from "../validators/auth.validator";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.post("/register", registerValidator, validate, register);
router.post("/login",    loginValidator,    validate, login);
router.post("/refresh",  refreshToken);
router.post("/logout",   logout);
router.get( "/me",       authenticate, getMe);

export default router;
