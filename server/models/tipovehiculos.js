import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TipoVehiculos = sequelize.define(
  "tipovehiculos",
  {
    idtipovehiculos: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "tipovehiculos",
    timestamps: false,
  }
);

export default TipoVehiculos;
