// server/controllers/roles.controller.js
import Rol from "../models/roles.model.js";
import { Op } from "sequelize";

// Listar roles
export async function list(req, res) {
  try {
    const { search = "" } = req.query;
    const roles = await Rol.findAll({
      where: search
        ? { descripcion: { [Op.like]: `%${search}%` } } // <- FIX
        : undefined,
      order: [["idroles", "DESC"]],
    });

    res.json({ ok: true, data: roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error listando roles" });
  }
}

// Obtener un rol por ID
export async function getOne(req, res) {
  try {
    const id = Number(req.params.id);
    const role = await Rol.findByPk(id);
    if (!role) {
      return res.status(404).json({ ok: false, msg: "Rol no encontrado" });
    }
    res.json({ ok: true, data: role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error obteniendo rol" });
  }
}

// Crear un rol
export async function create(req, res) {
  try {
    const descripcion = (req.body.descripcion || "").trim();
    if (!descripcion) {
      return res.status(400).json({ ok: false, msg: "Descripción requerida" });
    }

    const exists = await Rol.findOne({ where: { descripcion } });
    if (exists) {
      return res
        .status(409)
        .json({ ok: false, msg: "Ya existe un rol con esa descripción" });
    }

    const newRole = await Rol.create({ descripcion });
    res.status(201).json({ ok: true, data: newRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error creando rol" });
  }
}

// Actualizar un rol
export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const role = await Rol.findByPk(id);

    if (!role) {
      return res.status(404).json({ ok: false, msg: "Rol no encontrado" });
    }

    const descripcion = (req.body.descripcion || "").trim();
    if (!descripcion) {
      return res.status(400).json({ ok: false, msg: "Descripción requerida" });
    }

    if (descripcion.toLowerCase() !== role.descripcion.toLowerCase()) {
      const exists = await Rol.findOne({ where: { descripcion } });
      if (exists) {
        return res
          .status(409)
          .json({ ok: false, msg: "Ya existe un rol con esa descripción" });
      }
    }

    await role.update({ descripcion });
    res.json({ ok: true, data: role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error actualizando rol" });
  }
}

// Eliminar un rol
export async function remove(req, res) {
  try {
    const id = Number(req.params.id);

    // 🚫 No permitir eliminar Administrador (id = 1)
    if (id === 1) {
      return res
        .status(403)
        .json({ ok: false, msg: "El rol Administrador no se puede eliminar." });
    }

    const role = await Rol.findByPk(id);
    if (!role) {
      return res.status(404).json({ ok: false, msg: "Rol no encontrado" });
    }

    await role.destroy();
    res.json({ ok: true, msg: "Rol eliminado" });
  } catch (error) {
    console.error(error);

    if (
      error.name === "SequelizeForeignKeyConstraintError" ||
      error.parent?.errno === 1451 // MySQL: Cannot delete or update a parent row
    ) {
      return res.status(409).json({
        ok: false,
        msg:
          "No se puede eliminar el rol porque está en uso (usuarios/permisos asociados).",
      });
    }

    res.status(500).json({ ok: false, msg: "Error eliminando rol" });
  }
}
