import bcrypt from "bcrypt";
import Usuarios from "../models/usuarios.js";
import sequelize from "../config/db.js";

export const login = async (req, res) => {
  try {
    // ✅ Usar email en lugar de correo
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ ok: false, msg: "Faltan datos" });
    }

    // ✅ Buscar por email (en tu tabla está así)
    const usuario = await Usuarios.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    // Comparar contraseñas
    const passwordValida = contrasena == usuario.contrasena

    if (!passwordValida) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    // ✅ Respuesta usando email
    res.json({
      ok: true,
      msg: "Login exitoso",
      usuario: {
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        email: usuario.email,
        idroles: usuario.idroles,
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const hashPasswordsOnce = async (req, res) => {
  try {
    await sequelize.authenticate();

    const usuarios = await Usuarios.findAll();

    for (const user of usuarios) {
      if (user.contrasena.startsWith("$2")) continue;

      const hashedPassword = await bcrypt.hash(user.contrasena, 10);
      await user.update({ contrasena: hashedPassword });
    }

    res.json({ ok: true, msg: "Contraseñas encriptadas correctamente" });
  } catch (error) {
    console.error("Error en hashPasswordsOnce:", error);
    res.status(500).json({ ok: false, msg: "Error al encriptar contraseñas" });
  }
};
