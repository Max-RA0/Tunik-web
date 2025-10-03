import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import InicioSesion from "./features/auth/iniciosesion.provicional";
import Layout from "./Components/Layout"; // con el sidebar
import Dashboard from "./features/dashboard/dashboard";
import Servicios from "./features/dashboard/GestionServicios/servicios/servicios";
import Marcas from "./features/dashboard/GestionVehiculos/marca/marca";
import Vehiculos from "./features/dashboard/GestionVehiculos/vehiculo/vehiculo";
import Usuarios from "./features/dashboard/GestionUsuarios/usuarios/usuarios";
import CategoriasServicios from "./features/dashboard/GestionServicios/categoriaservicios/CategoriasServicios";
import MetodosPago from "./features/dashboard/GestionVentas/metodospago/MetodosPago";
import TipoVehiculos from "./features/dashboard/GestionVehiculos/tipovehiculo/tipovehiculo";
import Roles from "./features/dashboard/GestionConfiguracion/roles/Roles";
import Proveedores from "./features/dashboard/GestionVentas/GestionProveedor/Proveedor";
import EvaluacionServicios from "./features/dashboard/EvaluacionCliente/EvaluacionServicios";




// 🚀 Aquí más adelante puedes meter autenticación real con JWT
const isAuthenticated = true; // ⚠️ cambia esto con tu lógica de login

function App() {
  return (
    <Router>
      <Routes>
        {/* Página de login */}
        <Route path="/" element={<InicioSesion />} />

        {/* Rutas protegidas con Sidebar */}
        {isAuthenticated && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/GestionServicios/servicios" element={<Servicios />} />
            <Route path="/dashboard/GestionVehiculos/marca" element={<Marcas />} />
            <Route path="/dashboard/GestionVehiculos/tipovehiculo" element={<TipoVehiculos />} />
            <Route path="/dashboard/GestionVehiculos/vehiculo" element={<Vehiculos />} />
            <Route path="/dashboard/GestionUsuarios/usuarios" element={<Usuarios />} />
            <Route path="/dashboard/GestionServicios/CategoriaServicios" element={<CategoriasServicios />} />
            <Route path="/dashboard/GestionVentas/metodospago" element={<MetodosPago />} />
            <Route path="/dashboard/GestionConfiguracion/roles" element={<Roles />} />
            <Route path="/dashboard/GestionVentas/Proveedor" element={<Proveedores/>}/>
            <Route path="/dashboard/EvaluacionCliente/EvaluacionServicios" element={<EvaluacionServicios />}/>
            
          </Route>
        )}

        {/* Si la ruta no existe, redirige según autenticación */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
      </Routes>
    </Router>
  );
}

export default App;
