import { Router } from "express";
import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validate.js";
import * as ctrl from "../controllers/evaluacionservicios.controller.js";

const router = Router();

router.get(
  "/",
  validate([query("search").optional().isString().trim().isLength({ max: 100 })]),
  ctrl.list
);

router.get(
  "/:id",
  validate([param("id").isInt({ min: 1 })]),
  ctrl.getOne
);

router.post(
  "/",
  validate([
    body("cedula").notEmpty().trim().isLength({ max: 20 }),
    body("idservicios").isInt({ min: 1 }),
    body().custom((v) => v.calificacion != null || v.respuestacalificacion != null),
  ]),
  ctrl.create
);

router.put(
  "/:id",
  validate([
    param("id").isInt({ min: 1 }),
    body("cedula").optional().trim().isLength({ max: 20 }),
    body("idservicios").optional().isInt({ min: 1 }),
    body("calificacion").optional().isInt({ min: 1, max: 5 }),
    body("respuestacalificacion").optional().isInt({ min: 1, max: 5 }),
  ]),
  ctrl.update
);

router.delete(
  "/:id",
  validate([param("id").isInt({ min: 1 })]),
  ctrl.remove
);

export default router;     // <- IMPORTANTE
