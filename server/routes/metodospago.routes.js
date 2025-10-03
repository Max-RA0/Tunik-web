import { Router } from "express";
import {
  crearMetodoPago,
  editarMetodoPago,
  eliminarMetodoPago,
  listarMetodosPago,
  buscarMetodoPago,
} from "../controllers/metodospago.controller.js";

const router = Router();


router.post("/", crearMetodoPago)
router.put("/:id", editarMetodoPago);
router.delete("/:id", eliminarMetodoPago);
router.get("/", listarMetodosPago);
router.get("/:id", buscarMetodoPago);

export default router;