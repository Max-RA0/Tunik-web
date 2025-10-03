// server/controllers/categoriaservicios.controller.js
import { Op } from "sequelize";
import CategoriaServicios from "../models/categoriaservicios.js";

// Crear categoría
export const create = async (req, res) => {
  try {
    const { nombrecategorias, descripcion } = req.body;

    if (!nombrecategorias || !String(nombrecategorias).trim()) {
      return res.status(400).json({ ok: false, msg: "El nombre es obligatorio" });
    }

    const created = await CategoriaServicios.create({
      nombrecategorias: String(nombrecategorias).trim(),
      descripcion: descripcion ?? null,
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error("create categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error creando categoría", detail: err.message });
  }
};

// Listar con búsqueda opcional (?q=)
export const findAll = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const where = q
      ? {
          [Op.or]: [
            { nombrecategorias: { [Op.like]: `%${q}%` } },
            { descripcion: { [Op.like]: `%${q}%` } },
          ],
        }
      : {};

    const rows = await CategoriaServicios.findAll({
      where,
      order: [["idcategoriaservicios", "ASC"]],
    });

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("findAll categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error en findAll", detail: err.message });
  }
};

// Obtener por ID
export const findOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);
    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });
    res.json({ ok: true, data: item });
  } catch (err) {
    console.error("findOne categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error buscando categoría", detail: err.message });
  }
};

// Actualizar
export const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);
    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });

    const { nombrecategorias, descripcion } = req.body;

    if (nombrecategorias !== undefined && !String(nombrecategorias).trim()) {
      return res.status(400).json({ ok: false, msg: "El nombre no puede estar vacío" });
    }

    await item.update({
      nombrecategorias:
        nombrecategorias !== undefined ? String(nombrecategorias).trim() : item.nombrecategorias,
      descripcion: descripcion !== undefined ? descripcion : item.descripcion,
    });

    res.json({ ok: true, data: item });
  } catch (err) {
    console.error("update categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error actualizando categoría", detail: err.message });
  }
};

// Eliminar
export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);
    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });

    await item.destroy();
    res.json({ ok: true, msg: "Eliminada con éxito" });
  } catch (err) {
    console.error("remove categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error eliminando categoría", detail: err.message });
  }
};
