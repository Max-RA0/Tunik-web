// server/routes/usuarios.routes.js
import { Router } from "express";
import { create, findAll, findOne, update, remove } from "../controllers/usuarios.controller.js";

const router = Router();

// Crear usuario
router.post("/", create);

// Listar todos los usuarios
router.get("/", findAll);

// Buscar usuario por cédula
router.get("/:cedula", findOne);

// Actualizar usuario por cédula
router.put("/:cedula", update);

// Eliminar usuario por cédula
router.delete("/:cedula", remove);

export default router;
