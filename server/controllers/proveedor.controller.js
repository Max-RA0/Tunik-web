import proveedor from "../models/proveedor.js";

//CREATE
export const create = async (req, res) => {
  try {
    const proveedores = await proveedor.create(req.body);
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//LISTAR
export const findAll = async (req, res) => {
  try {
    const proveedors = await proveedor.findAll();
    res.json(proveedors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//BUSCAR POR ID
export const findOne = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    proveedores
      ? res.json(proveedores)
      : res.status(404).json({ message: "No encontrado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//EDITAR
export const update = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    if (!proveedores)
      return res.status(404).json({ message: "No encontrado" });

    await proveedores.update(req.body);
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//ELIMINAR
export const remove = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    if (!proveedores)
      return res.status(404).json({ message: "No encontrado" });

    await proveedores.destroy();
    res.json({ message: "Eliminado con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
