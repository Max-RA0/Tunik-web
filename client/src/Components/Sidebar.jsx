import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function initialsFrom(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => (n[0] || "").toUpperCase())
    .join("");
}

const CATEGORY_ROUTES = {
  usuarios: ["/dashboard/GestionUsuarios/usuarios"],
  servicios: [
    "/dashboard/GestionServicios/CategoriaServicios",
    "/dashboard/GestionServicios/servicios",
  ],
  ventas: ["/dashboard/GestionVentas/metodospago", "/dashboard/GestionVentas/proveedor"],
  // 👇 Añadimos la ruta para que el acordeón se abra en esta sección
  evaluacion: ["/dashboard/GestionServicios/evaluacionservicios"],
  vehiculos: [
    "/dashboard/GestionVehiculos/vehiculo",
    "/dashboard/GestionVehiculos/tipovehiculo",
    "/dashboard/GestionVehiculos/marca",
  ],
  configuracion: ["/dashboard/GestionConfiguracion/roles"],
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(
    () => ({ name: "Juan Pérez", email: "juan.perez@example.com" }),
    []
  );
  const initials = initialsFrom(user.name);

  const [open, setOpen] = useState({
    usuarios: false,
    servicios: false,
    ventas: false,
    evaluacion: false,
    vehiculos: false,
    configuracion: false,
  });

  useEffect(() => {
    const pathname = location.pathname;
    const next = { ...open };
    Object.keys(CATEGORY_ROUTES).forEach((key) => {
      next[key] = CATEGORY_ROUTES[key].some((r) => pathname.startsWith(r));
    });
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggle = (key) => {
    setOpen((prev) => {
      const cleared = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      cleared[key] = !prev[key];
      return cleared;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const catHeaderClass = (isOpen) =>
    "category-header" + (isOpen ? "" : " collapsed");
  const itemsClass = (isOpen) => "nav-items" + (isOpen ? "" : " collapsed");
  const navLinkClass = ({ isActive }) => "nav-item" + (isActive ? " active" : "");

  return (
    <nav className="sidebar" aria-label="Barra lateral">
      <div className="sidebar-header">
        <div className="brand">TUNIK</div>
        <div className="brand-sub">Sistema de Gestión</div>

        <div className="user-box">
          <div className="avatar">{initials || "US"}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/dashboard" className={navLinkClass}>
          <span className="material-symbols-rounded icon" aria-hidden="true">home</span>
          <span>Dashboard Principal</span>
        </NavLink>

        {/* Usuarios */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.usuarios)}
            onClick={() => toggle("usuarios")}
            aria-expanded={open.usuarios}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">person</span>
            <span>Gestión de Usuarios</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.usuarios)}>
            <NavLink to="/dashboard/GestionUsuarios/usuarios" className={navLinkClass}>
              Usuarios
            </NavLink>
          </div>
        </div>

        {/* Servicios */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.servicios)}
            onClick={() => toggle("servicios")}
            aria-expanded={open.servicios}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">handyman</span>
            <span>Gestion de Servicios</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.servicios)}>
            <NavLink to="/dashboard/GestionServicios/CategoriaServicios" className={navLinkClass}>
              Categorías Servicios
            </NavLink>
            <NavLink to="/dashboard/GestionServicios/servicios" className={navLinkClass}>
              Servicios
            </NavLink>
          </div>
        </div>

        {/* Ventas */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.ventas)}
            onClick={() => toggle("ventas")}
            aria-expanded={open.ventas}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">sell</span>
            <span>Gestion de Ventas</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.ventas)}>
            <NavLink to="/dashboard/GestionVentas/metodospago" className={navLinkClass}>
              Métodos de Pago
            </NavLink>
            <NavLink to="/dashboard/GestionVentas/proveedor" className={navLinkClass}>
              Proveedor
            </NavLink>
          </div>
        </div>

        {/* Evaluación */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.evaluacion)}
            onClick={() => toggle("evaluacion")}
            aria-expanded={open.evaluacion}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">grade</span>
            <span>Evaluación Cliente</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.evaluacion)}>
            {/* 👇 Ahora sí: el hijo que faltaba */}
            <NavLink
              to="/dashboard/EvaluacionCliente/EvaluacionServicios"
              className={navLinkClass}
            >
              Evaluación de Servicios
            </NavLink>
          </div>
        </div>

        {/* Vehículos */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.vehiculos)}
            onClick={() => toggle("vehiculos")}
            aria-expanded={open.vehiculos}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">directions_car</span>
            <span>Vehículos</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.vehiculos)}>
            <NavLink to="/dashboard/GestionVehiculos/vehiculo" className={navLinkClass}>
              Gestión de Vehículos
            </NavLink>
            <NavLink to="/dashboard/GestionVehiculos/tipovehiculo" className={navLinkClass}>
              Tipo Vehículos
            </NavLink>
            <NavLink to="/dashboard/GestionVehiculos/marca" className={navLinkClass}>
              Marca
            </NavLink>
          </div>
        </div>

        {/* Configuración */}
        <div className="nav-category">
          <button
            type="button"
            className={catHeaderClass(open.configuracion)}
            onClick={() => toggle("configuracion")}
            aria-expanded={open.configuracion}
          >
            <span className="material-symbols-rounded icon" aria-hidden="true">settings</span>
            <span>Configuración</span>
            <span className="material-symbols-rounded arrow" aria-hidden="true">expand_more</span>
          </button>
          <div className={itemsClass(open.configuracion)}>
            <NavLink to="/dashboard/GestionConfiguracion/roles" className={navLinkClass}>
              Roles
            </NavLink>
          </div>
        </div>
      </div>

      <div className="logout-section">
        <button className="logout" onClick={handleLogout}>
          <span className="material-symbols-rounded icon" aria-hidden="true">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
