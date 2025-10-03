// server/models/roles.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Rol = sequelize.define(
  "Rol",
  {
    idroles: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // OJO: si no haces sync({alter:true}) esto no toca el schema existente
    },
  },
  {
    tableName: "roles",
    timestamps: false,
  }
);

export default Rol;
