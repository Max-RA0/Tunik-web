// server/controllers/servicios.controller.js
import Servicios from "../models/servicios.js";
import CategoriaServicios from "../models/categoriaservicios.js"; // ✅ usa el mismo nombre que en el modelo

// ==============================
// Crear servicio
// ==============================
export const createServicio = async (req, res) => {
  try {
    const { nombreservicios, idcategoriaservicios, preciounitario } = req.body;

    // Validar que la categoría exista
    const categoria = await CategoriaServicios.findByPk(idcategoriaservicios);
    if (!categoria) {
      return res.status(400).json({ ok: false, msg: "Categoría no válida" });
    }

    const nuevoServicio = await Servicios.create({
      nombreservicios,
      idcategoriaservicios,
      preciounitario,
    });

    res.status(201).json({ ok: true, data: nuevoServicio });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Listar todos los servicios
// ==============================
export const getServicios = async (req, res) => {
  try {
    const servicios = await Servicios.findAll({
      include: [
        {
          model: CategoriaServicios,
          as: "categoriaservicios", // ✅ usa el alias correcto
          attributes: ["idcategoriaservicios", "nombrecategorias", "descripcion"],
        },
      ],
    });

    res.json({ ok: true, data: servicios });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Buscar servicio por ID
// ==============================
export const getServicioById = async (req, res) => {
  try {
    const servicio = await Servicios.findByPk(req.params.idservicios, {
      include: [
        {
          model: CategoriaServicios,
          as: "categoriaservicios",
          attributes: ["idcategoriaservicios", "nombrecategorias", "descripcion"],
        },
      ],
    });

    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    res.json({ ok: true, data: servicio });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Actualizar servicio
// ==============================
export const updateServicio = async (req, res) => {
  try {
    const servicio = await Servicios.findByPk(req.params.idservicios);
    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    // Si se envía nueva categoría, validarla
    if (req.body.idcategoriaservicios) {
      const categoria = await CategoriaServicios.findByPk(req.body.idcategoriaservicios);
      if (!categoria) {
        return res.status(400).json({ ok: false, msg: "Categoría no válida" });
      }
    }

    await servicio.update(req.body);
    res.json({ ok: true, data: servicio });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Eliminar servicio
// ==============================
export const deleteServicio = async (req, res) => {
  try {
    const servicio = await Servicios.findByPk(req.params.idservicios);
    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    await servicio.destroy();
    res.json({ ok: true, msg: "Servicio eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
