// server/routes/marcas.routes.js
import { Router } from "express";
import { create, findAll, findOne, update, remove } from "../controllers/marca.controller.js";

const router = Router();

router.post("/", create);       // Crear nueva marca
router.get("/", findAll);       // Listar todas las marcas
router.get("/:id", findOne);    // Obtener marca por ID
router.put("/:id", update);     // Actualizar marca
router.delete("/:id", remove);  // Eliminar marca

export default router;
