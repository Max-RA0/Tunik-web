// server/models/marca.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Marca = sequelize.define(
  "Marca",
  {
    idmarca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "marcas",
    timestamps: false,
  }
);

export default Marca;
