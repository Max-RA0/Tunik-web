// server/routes/vehiculos.routes.js
import { Router } from "express";
import { create, findAll, findOne, update, remove } from "../controllers/vehiculo.controller.js";

const router = Router();

router.post("/", create);       // Crear vehículo
router.get("/", findAll);       // Listar todos los vehículos
router.get("/:id", findOne);    // Obtener vehículo por ID
router.put("/:id", update);     // Actualizar vehículo
router.delete("/:id", remove);  // Eliminar vehículo

export default router;
