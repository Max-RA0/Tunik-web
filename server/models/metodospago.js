import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; 

const MetodoPago = sequelize.define("MetodoPago", {
  idmpago: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombremetodo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: "metodospago",
  timestamps: false,
});

export default MetodoPago;
