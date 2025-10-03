import TipoVehiculos from "../models/tipovehiculos.js";

// Obtener todos
export const getTipoVehiculos = async (req, res) => {
  try {
    const tipos = await TipoVehiculos.findAll();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tipos de vehículos", error: error.message });
  }
};

// Obtener por ID
export const getTipoVehiculoById = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tipo de vehículo", error: error.message });
  }
};

// Crear
export const createTipoVehiculo = async (req, res) => {
  try {
    const nuevo = await TipoVehiculos.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: "Error al crear tipo de vehículo", error: error.message });
  }
};

// Actualizar
export const updateTipoVehiculo = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });

    await tipo.update(req.body);
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar tipo de vehículo", error: error.message });
  }
};

// Eliminar
export const deleteTipoVehiculo = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });

    await tipo.destroy();
    res.json({ message: "Tipo de vehículo eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar tipo de vehículo", error: error.message });
  }
};
