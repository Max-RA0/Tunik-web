import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";


const proveedor = sequelize.define("proveedor", {

idproveedor: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
},

nombre: {

    type: DataTypes.STRING,
    allowNull: false,

},


telefono: {

    type: DataTypes.STRING,
    allowNull: false,

},

correo: {

    type: DataTypes.STRING,
    allowNull: false,

},


nombreempresa: {

    type: DataTypes.STRING,
    allowNull: false,

},

}, {

    tableName: "proveedor",
    timestamps: false
});

export default proveedor;