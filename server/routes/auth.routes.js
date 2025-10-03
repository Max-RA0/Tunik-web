// server/routes/auth.routes.js
import { Router } from "express";
import { login, hashPasswordsOnce } from "../controllers/auth.controller.js";

const router = Router();

// Ruta para login
router.post("/login", login);

// Ruta para encriptar contraseñas (SOLO UNA VEZ)
router.get("/hash-passwords", hashPasswordsOnce);

export default router;
