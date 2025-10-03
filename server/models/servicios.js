// server/models/servicios.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import CategoriaServicios from "./categoriaservicios.js"; // ✅ Importamos el modelo de categoría

const Servicios = sequelize.define(
  "Servicios",
  {
    idservicios: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombreservicios: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    idcategoriaservicios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CategoriaServicios,
        key: "idcategoriaservicios",
      },
    },
    preciounitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "servicios",
    timestamps: false,
  }
);

// --------------------
// Relaciones
// --------------------
CategoriaServicios.hasMany(Servicios, {
  foreignKey: "idcategoriaservicios",
  as: "servicios",
});

Servicios.belongsTo(CategoriaServicios, {
  foreignKey: "idcategoriaservicios",
  as: "categoriaservicios",
});

export default Servicios;
