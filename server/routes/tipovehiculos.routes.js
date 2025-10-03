import { Router } from "express";
import {
  getTipoVehiculos,
  getTipoVehiculoById,
  createTipoVehiculo,
  updateTipoVehiculo,
  deleteTipoVehiculo,
} from "../controllers/tipovehiculos.controller.js";

const router = Router();

// Obtener todos los tipos de vehículos
router.get("/", getTipoVehiculos);

// Obtener un tipo de vehículo por ID
router.get("/:id", getTipoVehiculoById);

// Crear un nuevo tipo de vehículo
router.post("/", createTipoVehiculo);

// Actualizar un tipo de vehículo
router.put("/:id", updateTipoVehiculo);

// Eliminar un tipo de vehículo
router.delete("/:id", deleteTipoVehiculo);

export default router;
