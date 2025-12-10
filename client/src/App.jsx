import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth
import InicioSesion from "./features/auth/iniciosesion.provicional";
import RecuperarContrasena from "./features/auth/RecuperarContrasena";
import NuevaContrasena from "./features/auth/NuevaContrasena";
import Registrarse from "./features/auth/Registrarse";

// Layout + Dashboard
import Layout from "./Components/Layout";
import Dashboard from "./features/dashboard/dashboard";

// Dashboard: Servicios
import Servicios from "./features/dashboard/GestionServicios/servicios/servicios";
import CategoriasServicios from "./features/dashboard/GestionServicios/categoriaservicios/CategoriasServicios";
import AgendaCitas from "./features/dashboard/GestionServicios/agendaCitas/agendaCitas";

// Dashboard: Vehículos
import Marcas from "./features/dashboard/GestionVehiculos/marca/marca";
import Vehiculos from "./features/dashboard/GestionVehiculos/vehiculo/vehiculo";
import TipoVehiculos from "./features/dashboard/GestionVehiculos/tipovehiculo/tipovehiculo";

// Dashboard: Usuarios
import Usuarios from "./features/dashboard/GestionUsuarios/usuarios/usuarios";

// Dashboard: Compras
import Proveedores from "./features/dashboard/GestionCompras/Proveedor/Proveedor";
import Productos from "./features/dashboard/GestionCompras/Producto/Producto";
import Pedidos from "./features/dashboard/GestionCompras/pedidos/pedidos";

// Dashboard: Ventas
import MetodosPago from "./features/dashboard/GestionVentas/metodospago/MetodosPago";
import Cotizaciones from "./features/dashboard/Gestionventas/Cotizaciones/Cotizaciones";

// Dashboard: Config + Evaluación
import Roles from "./features/dashboard/GestionConfiguracion/roles/Roles";
import EvaluacionServicios from "./features/dashboard/EvaluacionCliente/EvaluacionServicios";

// Cliente
import LandingCliente from "./landing/landing";
import EvaluacionCliente from "./landing/evaluacion/evaluacionCliente";
import AgendarCitaCliente from "./landing/citas/AgendarCitaCliente";
import PerfilCliente from "./landing/perfil/PerfilCliente";
import VehiculosCliente from "./landing/vehiculo/VehiculosCliente";

/* ------------------ Session helpers ------------------ */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getSessionUser() {
  return safeParse(localStorage.getItem("usuario") || "null");
}

function isAuthenticatedNow() {
  return !!getSessionUser();
}

function getUserRole() {
  const u = getSessionUser();
  return String(u?.rol || "").toLowerCase();
}

function getDefaultRouteForRole(role) {
  return role === "cliente" ? "/cliente" : "/dashboard";
}

/* ------------------ Guards ------------------ */
function Guard({ allow, redirectTo, children }) {
  if (!isAuthenticatedNow()) return <Navigate to="/" replace />;
  const rol = getUserRole();
  if (!allow.includes(rol)) return <Navigate to={redirectTo} replace />;
  return children;
}

function RequireAdmin({ children }) {
  return (
    <Guard allow={["administrador"]} redirectTo="/cliente">
      {children}
    </Guard>
  );
}

function RequireCliente({ children }) {
  return (
    <Guard allow={["cliente"]} redirectTo="/dashboard">
      {children}
    </Guard>
  );
}

export default function App() {
  const fallback = isAuthenticatedNow()
    ? getDefaultRouteForRole(getUserRole())
    : "/";

  return (
    <Router>
      <Routes>
        {/* ------------------ Públicas ------------------ */}
        <Route path="/" element={<InicioSesion />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/reset-password/:token" element={<NuevaContrasena />} />
        <Route path="/registrarse" element={<Registrarse />} />

        {/* ------------------ Cliente ------------------ */}
        <Route
          path="/cliente"
          element={
            <RequireCliente>
              <LandingCliente />
            </RequireCliente>
          }
        />
        <Route
          path="/cliente/perfil"
          element={
            <RequireCliente>
              <PerfilCliente />
            </RequireCliente>
          }
        />
        <Route
          path="/cliente/evaluacion"
          element={
            <RequireCliente>
              <EvaluacionCliente />
            </RequireCliente>
          }
        />
        <Route
          path="/cliente/agendamiento"
          element={
            <RequireCliente>
              <AgendarCitaCliente />
            </RequireCliente>
          }
        />
        <Route
          path="/cliente/vehiculos"
          element={
            <RequireCliente>
              <VehiculosCliente />
            </RequireCliente>
          }
        />

        {/* ------------------ Alias (compatibilidad) ------------------ */}
        <Route
          path="/landing"
          element={
            <RequireCliente>
              <LandingCliente />
            </RequireCliente>
          }
        />
        <Route
          path="/evaluacion-cliente"
          element={<Navigate to="/cliente/evaluacion" replace />}
        />

        {/* ------------------ Dashboard (Admin) ------------------ */}
        <Route
          element={
            <RequireAdmin>
              <Layout />
            </RequireAdmin>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Servicios */}
          <Route
            path="/dashboard/GestionServicios/servicios"
            element={<Servicios />}
          />
          <Route
            path="/dashboard/GestionServicios/CategoriaServicios"
            element={<CategoriasServicios />}
          />
          <Route
            path="/dashboard/GestionServicios/agendaCitas"
            element={<AgendaCitas />}
          />

          {/* Vehículos */}
          <Route path="/dashboard/GestionVehiculos/marca" element={<Marcas />} />
          <Route
            path="/dashboard/GestionVehiculos/tipovehiculo"
            element={<TipoVehiculos />}
          />
          <Route
            path="/dashboard/GestionVehiculos/vehiculo"
            element={<Vehiculos />}
          />

          {/* Usuarios */}
          <Route
            path="/dashboard/GestionUsuarios/usuarios"
            element={<Usuarios />}
          />

          {/* Ventas */}
          <Route
            path="/dashboard/GestionVentas/metodospago"
            element={<MetodosPago />}
          />
          <Route
            path="/dashboard/GestionVentas/cotizaciones"
            element={<Cotizaciones />}
          />

          {/* Compras */}
          <Route
            path="/dashboard/GestionCompras/Proveedor"
            element={<Proveedores />}
          />
          <Route
            path="/dashboard/GestionCompras/producto"
            element={<Productos />}
          />
          <Route
            path="/dashboard/GestionCompras/pedidos"
            element={<Pedidos />}
          />

          {/* Configuración */}
          <Route
            path="/dashboard/GestionConfiguracion/roles"
            element={<Roles />}
          />

          {/* Evaluación */}
          <Route
            path="/dashboard/EvaluacionCliente/EvaluacionServicios"
            element={<EvaluacionServicios />}
          />
        </Route>

        {/* ------------------ Catch-all ------------------ */}
        <Route path="*" element={<Navigate to={fallback} replace />} />
      </Routes>
    </Router>
  );
}
