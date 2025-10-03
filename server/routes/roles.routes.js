// server/routes/roles.routes.js
import { Router } from "express";
import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validate.js";
import * as ctrl from "../controllers/roles.controller.js";

const router = Router();

// GET /api/roles?search=emple
router.get(
  "/",
  validate([query("search").optional().isString().trim().isLength({ max: 100 })]),
  ctrl.list
);

// GET /api/roles/:id
router.get(
  "/:id",
  validate([param("id").isInt({ min: 1 }).withMessage("id inválido")]),
  ctrl.getOne
);

// POST /api/roles
router.post(
  "/",
  validate([body("descripcion").notEmpty().trim().isLength({ min: 2, max: 100 })]),
  ctrl.create
);

// PUT /api/roles/:id
router.put(
  "/:id",
  validate([
    param("id").isInt({ min: 1 }),
    body("descripcion").notEmpty().trim().isLength({ min: 2, max: 100 }),
  ]),
  ctrl.update
);

// DELETE /api/roles/:id
router.delete(
  "/:id",
  validate([param("id").isInt({ min: 1 })]),
  ctrl.remove
);

export default router;
