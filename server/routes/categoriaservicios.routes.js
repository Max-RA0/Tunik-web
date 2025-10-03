// server/routes/categoriaservicios.routes.js
import { Router } from "express";
import { create, findAll, findOne, update, remove } from "../controllers/categoriaservicios.controller.js";

const router = Router();

// Crear
router.post("/", create);

// Listar (con ?q= para búsqueda)
router.get("/", findAll);

// Obtener por ID
router.get("/:id", findOne);

// Editar
router.put("/:id", update);

// Eliminar
router.delete("/:id", remove);

export default router;
