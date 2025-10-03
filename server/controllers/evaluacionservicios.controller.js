// server/controllers/evaluacionservicios.controller.js
import { Op } from "sequelize";
import EvaluacionServicio from "../models/evaluacionservicios.model.js";
import Usuario from "../models/usuarios.js";           // tu modelo existente
import Servicio from "../models/servicios.js";          // tu modelo existente

function normalizeRating(input) {
  // Acepta calificacion (número) o respuestacalificacion (string/num)
  const n =
    input?.calificacion ??
    input?.respuestacalificacion ??
    input?.rating ??
    input?.score;

  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  const i = Math.trunc(num);
  return i >= 1 && i <= 5 ? i : null;
}

function exposeRow(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  const cal = Number(plain.respuestacalificacion);
  return {
    ...plain,
    // Añadimos un alias numérico para el front
    calificacion: Number.isFinite(cal) ? cal : null,
  };
}

// GET /api/evaluaciones?search=XYZ
export async function list(req, res) {
  try {
    const { search = "" } = req.query;
    const where = search
      ? {
          [Op.or]: [
            { cedula: { [Op.like]: `%${search}%` } },
            { idservicios: { [Op.like]: `%${search}%` } },
            { respuestacalificacion: { [Op.like]: `%${search}%` } },
          ],
        }
      : undefined;

    const rows = await EvaluacionServicio.findAll({
      where,
      order: [["idevaluacion", "DESC"]],
    });

    res.json({ ok: true, data: rows.map(exposeRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error listando evaluaciones" });
  }
}

// GET /api/evaluaciones/:id
export async function getOne(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });
    res.json({ ok: true, data: exposeRow(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error obteniendo evaluación" });
  }
}

// POST /api/evaluaciones
export async function create(req, res) {
  try {
    const { cedula, idservicios } = req.body;
    const rating = normalizeRating(req.body);

    if (!cedula || !idservicios)
      return res
        .status(400)
        .json({ ok: false, msg: "cedula e idservicios son requeridos" });

    if (rating == null)
      return res
        .status(400)
        .json({ ok: false, msg: "calificacion debe ser un entero 1–5" });

    // (Opcional) validar existencia de usuario/servicio
    const user = await Usuario.findByPk(String(cedula));
    if (!user) return res.status(404).json({ ok: false, msg: "Usuario no existe" });

    const serv = await Servicio.findByPk(Number(idservicios));
    if (!serv) return res.status(404).json({ ok: false, msg: "Servicio no existe" });

    const created = await EvaluacionServicio.create({
      cedula: String(cedula),
      idservicios: Number(idservicios),
      respuestacalificacion: String(rating), // << guardamos el número como string
    });

    res.status(201).json({ ok: true, data: exposeRow(created) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error creando evaluación" });
  }
}

// PUT /api/evaluaciones/:id
export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });

    const updates = {};
    if (req.body.cedula) updates.cedula = String(req.body.cedula);
    if (req.body.idservicios) updates.idservicios = Number(req.body.idservicios);

    if (
      req.body.calificacion != null ||
      req.body.respuestacalificacion != null ||
      req.body.rating != null
    ) {
      const r = normalizeRating(req.body);
      if (r == null)
        return res
          .status(400)
          .json({ ok: false, msg: "calificacion debe ser 1–5" });
      updates.respuestacalificacion = String(r);
    }

    await row.update(updates);
    res.json({ ok: true, data: exposeRow(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error actualizando evaluación" });
  }
}

// DELETE /api/evaluaciones/:id
export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });
    await row.destroy();
    res.json({ ok: true, msg: "Eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error eliminando evaluación" });
  }
}
