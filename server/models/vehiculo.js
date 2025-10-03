// server/models/vehiculo.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import TipoVehiculo from "./tipovehiculos.js";
import Marca from "./marca.js";
import Usuarios from "./usuarios.js";

const Vehiculo = sequelize.define(
  "Vehiculo",
  {
    placa: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
    },
    modelo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    idtipovehiculos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TipoVehiculo,
        key: "idtipovehiculos",
      },
    },
    idmarca: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Marca,
        key: "idmarca",
      },
    },
    cedula: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: Usuarios,
        key: "cedula",
      },
    },
  },
  {
    tableName: "vehiculos",
    timestamps: false,
  }
);

// --------------------
// Relaciones
// --------------------
TipoVehiculo.hasMany(Vehiculo, {
  foreignKey: "idtipovehiculos",
  as: "vehiculos",
});

Vehiculo.belongsTo(TipoVehiculo, {
  foreignKey: "idtipovehiculos",
  as: "tipo",
});

Marca.hasMany(Vehiculo, {
  foreignKey: "idmarca",
  as: "vehiculos",
});

Vehiculo.belongsTo(Marca, {
  foreignKey: "idmarca",
  as: "marca",
});

Usuarios.hasMany(Vehiculo, {
  foreignKey: "cedula",
  as: "vehiculos",
});

Vehiculo.belongsTo(Usuarios, {
  foreignKey: "cedula",
  as: "usuario",
});

export default Vehiculo;
