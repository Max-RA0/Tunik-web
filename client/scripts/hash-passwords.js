// scripts/hash-passwords.js
import bcrypt from "bcrypt";
import Usuarios from "../server/models/usuarios.js";
import sequelize from "../server/config/db.js";

const hashPasswords = async () => {
  try {
    await sequelize.authenticate();

    console.log("🔑 Conectado a la base de datos. Encriptando contraseñas...");

    const usuarios = await Usuarios.findAll();

    for (const user of usuarios) {
      if (user.contrasena.startsWith("$2")) continue; // Saltar si ya está encriptada

      const hashedPassword = await bcrypt.hash(user.contrasena, 10);
      await user.update({ contrasena: hashedPassword });

      console.log(`✅ Contraseña actualizada para: ${user.email}`);
    }

    console.log("🎉 Proceso completado. Todas las contraseñas están encriptadas.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    process.exit(1);
  }
};

hashPasswords();
