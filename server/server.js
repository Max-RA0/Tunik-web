// server/server.js
import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import sequelize from "./config/db.js";

// Importar rutas
import tipovehiculosRoutes from "./routes/tipovehiculos.routes.js";
import categoriaserviciosRoutes from "./routes/categoriaservicios.routes.js";
import rolesAclStaticRoutes from "./routes/roles.acl.static.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import vehiculosRoutes from "./routes/vehiculos.routes.js";
import marcasRoutes from "./routes/marcas.routes.js";
import metodospagoRoutes from "./routes/metodospago.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js"
import serviciosRoutes from "./routes/servicios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import proveedorRoutes from "./routes/proveedor.routes.js";
import evaluacionesRoutes from "./routes/evaluacionservicios.routes.js";




dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Conexión a MySQL
try {
  await sequelize.authenticate();
  console.log("✅ Conectado a MySQL correctamente.");
} catch (error) {
  console.error("❌ Error al conectar a MySQL:", error);
}

// Usar rutas
app.use("/api/tipovehiculos", tipovehiculosRoutes);
app.use("/api/categoriaservicios", categoriaserviciosRoutes);
app.use("/api/roles", rolesAclStaticRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/metodospago", metodospagoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/evaluaciones", evaluacionesRoutes);



app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
