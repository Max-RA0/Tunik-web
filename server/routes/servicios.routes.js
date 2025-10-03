// server/routes/servicios.routes.js
import { Router } from "express";
import {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio,
} from "../controllers/servicios.controller.js";

const router = Router();

/**
 * ==========================================
 * RUTAS DE SERVICIOS
 * Base: /api/servicios
 * ==========================================
 */

/**
 * @route GET /api/servicios
 * @desc Obtener todos los servicios con su categoría
 */
router.get("/", getServicios);

/**
 * @route GET /api/servicios/:idservicios
 * @desc Obtener un servicio por ID
 */
router.get("/:idservicios", getServicioById);

/**
 * @route POST /api/servicios
 * @desc Crear un nuevo servicio
 * @body {nombreservicios, idcategoriaservicios, preciounitario}
 */
router.post("/", createServicio);

/**
 * @route PUT /api/servicios/:idservicios
 * @desc Actualizar un servicio existente
 */
router.put("/:idservicios", updateServicio);

/**
 * @route DELETE /api/servicios/:idservicios
 * @desc Eliminar un servicio por ID
 */
router.delete("/:idservicios", deleteServicio);

export default router;
