// server/controllers/marca.controller.js
import Marca from "../models/marca.js";

// Crear una nueva marca
export const create = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion) {
      return res.status(400).json({ ok: false, msg: "La descripcion es obligatorio" });
    }

    const nuevaMarca = await Marca.create({ descripcion });
    res.status(201).json({ ok: true, data: nuevaMarca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error creando la marca" });
  }
};

// Listar todas las marcas
export const findAll = async (req, res) => {
  try {
    const marcas = await Marca.findAll();
    res.json({ ok: true, data: marcas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error listando marcas" });
  }
};

// Buscar marca por ID
export const findOne = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    res.json({ ok: true, data: marca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error obteniendo la marca" });
  }
};

// Actualizar marca
export const update = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    const { descripcion } = req.body;
    await marca.update({ descripcion });
    res.json({ ok: true, data: marca });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error actualizando la marca" });
  }
};

// Eliminar marca
export const remove = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    await marca.destroy();
    res.json({ ok: true, msg: "Marca eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error eliminando la marca" });
  }
};
