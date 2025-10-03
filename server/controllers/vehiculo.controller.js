// server/controllers/vehiculo.controller.js
import Vehiculo from "../models/vehiculo.js";
import TipoVehiculo from "../models/tipovehiculos.js";
import Marca from "../models/marca.js";
import Usuarios from "../models/usuarios.js";

// Crear vehículo
export const create = async (req, res) => {
  try {
    const { placa, modelo, color, idtipovehiculos, idmarcas } = req.body;

    const nuevoVehiculo = await Vehiculo.create({
      placa,
      modelo,
      color,
      idtipovehiculos,
      idmarca,
    });

    res.status(201).json({ ok: true, data: nuevoVehiculo });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Listar todos los vehículos con tipo y marca
export const findAll = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["idtipovehiculos", "nombre"],
        },
        {
          model: Marca,
          as: "marca",
          attributes: ["idmarca", "descripcion"],
        },
        {
          model: Usuarios,
          as: "usuario",
          attributes: ["cedula", "nombre", "telefono", "email"],
        },
      ],
    });
    res.json({ ok: true, data: vehiculos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Buscar por ID
export const findOne = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id, {
      include: [
        {
          model: TipoVehiculo,
          as: "tipo",
          attributes: ["idtipovehiculos", "nombre"],
        },
        {
          model: Marca,
          as: "marca",
          attributes: ["idmarcas", "nombre"],
        },
        {
          model: Usuarios,
          as: "usuario",
          attributes: ["cedula", "nombre", "telefono", "email"],
        },
      ],
    });

    vehiculo
      ? res.json({ ok: true, data: vehiculo })
      : res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar
export const update = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);

    if (!vehiculo)
      return res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });

    await vehiculo.update(req.body);
    res.json({ ok: true, data: vehiculo });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Eliminar
export const remove = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);

    if (!vehiculo)
      return res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });

    await vehiculo.destroy();
    res.json({ ok: true, msg: "Vehículo eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
