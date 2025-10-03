// server/models/categoriaservicios.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CategoriaServicios = sequelize.define(
  "CategoriaServicios",
  {
    idcategoriaservicios: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombrecategorias: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "categoriaservicios",
    timestamps: false,
  }
);

export default CategoriaServicios;
