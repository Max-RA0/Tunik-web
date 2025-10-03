import MetodoPago from "../models/metodospago.js";

// Crear método de pago
export const crearMetodoPago = async (req, res) => {
  try {
    const { nombremetodo } = req.body;
    if (!nombremetodo) {
      return res.status(400).json({ message: "El nombre del método de pago es obligatorio" });
    }
    const nuevoMetodo = await MetodoPago.create({ nombremetodo });
    res.status(201).json(nuevoMetodo);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el método de pago", error: error.message });
  }
};

// Editar método de pago
export const editarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombremetodo } = req.body;

    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });

    metodo.nombremetodo = nombremetodo || metodo.nombremetodo;
    await metodo.save();

    res.json(metodo);
  } catch (error) {
    res.status(500).json({ message: "Error al editar el método de pago", error: error.message });
  }
};

// Eliminar método de pago
export const eliminarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });

    await metodo.destroy();
    res.json({ message: "Método de pago eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el método de pago", error: error.message });
  }
};

// Listar todos los métodos de pago
export const listarMetodosPago = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll();
    res.json(metodos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener métodos de pago", error: error.message });
  }
};

// Buscar por ID 
export const buscarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });
    res.json(metodo);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el método de pago", error: error.message });
  }
};
