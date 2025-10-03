// server/models/evaluacionservicios.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EvaluacionServicio = sequelize.define(
  "EvaluacionServicio",
  {
    idevaluacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cedula: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    idservicios: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // ⚠️ SIN cambiar la BD: guardamos el número 1–5 como string aquí
    respuestacalificacion: {
      type: DataTypes.STRING(255),
      allowNull: false, // lo usamos para rating, así que lo exigimos en la app
    },
  },
  {
    tableName: "evaluacionservicios",
    timestamps: false,
  }
);

export default EvaluacionServicio;
