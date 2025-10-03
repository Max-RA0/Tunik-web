// server/routes/roles.acl.static.routes.js
import { Router } from "express";
import { body, param } from "express-validator";
import { getOptions, getAcl, putAcl } from "../controllers/roles.acl.static.controller.js";

const router = Router();

/** Opciones estáticas (para poblar checkboxes) */
router.get("/acl-options", getOptions);

/** Leer ACL de un rol */
router.get(
  "/:id/acl",
  param("id").isInt({ min: 1 }).withMessage("id inválido").toInt(),
  (req, res, next) => next(),
  getAcl
);

/** Actualizar ACL de un rol */
router.put(
  "/:id/acl",
  param("id").isInt({ min: 1 }).withMessage("id inválido").toInt(),
  body("permisos").optional().isArray(),
  body("privilegios").optional().isArray(),
  (req, res, next) => next(),
  putAcl
);

export default router;
