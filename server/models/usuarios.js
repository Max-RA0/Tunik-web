import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Rol from "./roles.model.js"; // ✅ Import correcto

const Usuarios = sequelize.define(
  "Usuarios",
  {
    cedula: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contrasena: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    idroles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles", // ✅ Usa el nombre de la tabla, no el modelo directamente
        key: "idroles",
      },
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);

// --------------------
// Relaciones
// --------------------
Rol.hasMany(Usuarios, {
  foreignKey: "idroles",
  as: "usuarios",
});

Usuarios.belongsTo(Rol, {
  foreignKey: "idroles",
  as: "roles",
});

export default Usuarios;