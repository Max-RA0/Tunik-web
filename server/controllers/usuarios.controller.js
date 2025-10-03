// server/controllers/usuarios.controller.js
import Usuarios from "../models/usuarios.js";
import Rol from "../models/roles.model.js";

// Crear usuario
export const create = async (req, res) => {
  try {
    const { cedula, nombre, telefono, email, contrasena, idroles } = req.body;

    const nuevoUsuario = await Usuarios.create({
      cedula,
      nombre,
      telefono,
      email,
      contrasena,
      idroles,
    });

    res.status(201).json({ ok: true, data: nuevoUsuario });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Listar todos los usuarios con su rol
export const findAll = async (req, res) => {
  try {
    const usuarios = await Usuarios.findAll({
      include: [
        {
          model: Rol,
          as: "roles",
          attributes: ["idroles", "descripcion"],
        },
      ],
    });
    res.json({ ok: true, data: usuarios });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Buscar usuario por cédula
export const findOne = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.cedula, {
      include: [
        {
          model: Rol,
          as: "roles",
          attributes: ["idroles", "descripcion"],
        },
      ],
    });

    usuario
      ? res.json({ ok: true, data: usuario })
      : res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar usuario
export const update = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.cedula);

    if (!usuario)
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });

    await usuario.update(req.body);
    res.json({ ok: true, data: usuario });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Eliminar usuario
export const remove = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.cedula);

    if (!usuario)
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });

    await usuario.destroy();
    res.json({ ok: true, msg: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
