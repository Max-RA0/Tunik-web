import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function initialsFrom(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => (n[0] || "").toUpperCase())
    .join("");
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function extractKeyLike(v) {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    const k = v.key ?? v.codigo ?? v.id ?? v.Id ?? v.subKey ?? v.value ?? null;
    return k == null ? "" : String(k);
  }
  return "";
}

/* --- Subprocesos -> rutas --- */
const SUBROUTE_BY_SUBKEY = {
  // usuarios
  usuarios: "/dashboard/GestionUsuarios/usuarios",

  // servicios
  categoriaservicios: "/dashboard/GestionServicios/CategoriaServicios",
  servicios: "/dashboard/GestionServicios/servicios",
  agendacitas: "/dashboard/GestionServicios/agendaCitas",

  // compras )
  proveedor: "/dashboard/GestionCompras/Proveedor",
  productos: "/dashboard/GestionCompras/Producto",
  pedidos: "/dashboard/GestionCompras/Pedidos",


  // ventas 
  metodospago: "/dashboard/GestionVentas/metodospago",
  cotizaciones: "/dashboard/GestionVentas/cotizaciones",

  // evaluación
  evaluacionservicios: "/dashboard/EvaluacionCliente/EvaluacionServicios",

  // vehículos
  vehiculo: "/dashboard/GestionVehiculos/vehiculo",
  tipovehiculo: "/dashboard/GestionVehiculos/tipovehiculo",
  marca: "/dashboard/GestionVehiculos/marca",

  // config
  roles: "/dashboard/GestionConfiguracion/roles",
};

const MODULE_TO_SUBS = {
  usuarios: ["usuarios"],
  servicios: ["categoriaservicios", "servicios", "agendacitas"],
  compras: ["proveedor", "productos", "pedidos"],
  ventas: ["metodospago", "cotizaciones"],
  evaluacion: ["evaluacionservicios"],
  vehiculos: ["vehiculo", "tipovehiculo", "marca"],
  configuracion: ["roles"],
};

const MODULE_OPEN_MATCHES = {
  ...MODULE_TO_SUBS,
  compras: [...MODULE_TO_SUBS.compras, "detallepedidos"],
  ventas: [...MODULE_TO_SUBS.ventas, "detallecotizaciones"],
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() =>
    safeParse(localStorage.getItem("usuario") || "null", null)
  );

  const [acl, setAcl] = useState(() =>
    safeParse(localStorage.getItem("acl") || "null", null)
  );

  // sincroniza cuando cambia la ruta (y al montar)
  useEffect(() => {
    setUser(safeParse(localStorage.getItem("usuario") || "null", null));
    setAcl(safeParse(localStorage.getItem("acl") || "null", null));
  }, [location.pathname]);

  // sincroniza si cambia el storage (útil con varias pestañas)
  useEffect(() => {
    const onStorage = () => {
      setUser(safeParse(localStorage.getItem("usuario") || "null", null));
      setAcl(safeParse(localStorage.getItem("acl") || "null", null));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!user) return null;

  const displayName = user?.nombre || user?.name || "";
  const displayEmail = user?.email || "";
  const initials = initialsFrom(displayName) || "US";

  /* --- ACL del usuario logueado --- */
  const hasAcl = useMemo(() => {
    if (!acl || typeof acl !== "object") return false;
    const p = acl.permisos;
    if (Array.isArray(p)) return p.length > 0;
    if (p && typeof p === "object") return Object.keys(p).length > 0;
    return false;
  }, [acl]);

  //  set permitido (soporta array u objeto)
  const allowedSubs = useMemo(() => {
    if (!hasAcl) return null; // null => mostrar todo
    const p = acl?.permisos;

    if (Array.isArray(p)) {
      return new Set(p.map(extractKeyLike).filter(Boolean));
    }

    if (p && typeof p === "object") {
      const all = [];
      Object.values(p).forEach((arr) => {
        (Array.isArray(arr) ? arr : []).forEach((x) =>
          all.push(extractKeyLike(x))
        );
      });
      return new Set(all.filter(Boolean));
    }

    return new Set();
  }, [acl, hasAcl]);

  const canSeeSub = (subKeyRaw) => {
    const subKey = String(subKeyRaw);

    //  Si NO hay ACL => muestra TODO
    if (!hasAcl) return true;

    // si hay ACL, usa el set
    return allowedSubs ? allowedSubs.has(subKey) : false;
  };

  const canSeeModule = (moduleKey) => {
    const subs = MODULE_TO_SUBS[moduleKey] || [];
    return subs.some((sub) => canSeeSub(sub));
  };

  const [open, setOpen] = useState({
    usuarios: false,
    servicios: false,
    compras: false,
    ventas: false,
    evaluacion: false,
    vehiculos: false,
    configuracion: false,
  });

  /* --- Abrir acordeón según ruta --- */
  useEffect(() => {
    const pathname = location.pathname;
    setOpen((prev) => {
      const next = { ...prev };
      Object.entries(MODULE_OPEN_MATCHES).forEach(([mod, subs]) => {
        next[mod] = subs.some((sub) => {
          const base = SUBROUTE_BY_SUBKEY[sub];
          return base ? pathname.startsWith(base) : false;
        });
      });
      return next;
    });
  }, [location.pathname]);

  const toggle = (key) => {
    setOpen((prev) => {
      const cleared = Object.fromEntries(
        Object.keys(prev).map((k) => [k, false])
      );
      cleared[key] = !prev[key];
      return cleared;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("acl");
    navigate("/");
  };

  const catHeaderClass = (isOpen) =>
    "category-header" + (isOpen ? "" : " collapsed");
  const itemsClass = (isOpen) => "nav-items" + (isOpen ? "" : " collapsed");
  const navLinkClass = ({ isActive }) =>
    "nav-item" + (isActive ? " active" : "");

  return (
    <nav className="sidebar" aria-label="Barra lateral">
      <div className="sidebar-header">
        <div className="brand">TUNIK</div>
        <div className="brand-sub">Sistema de Gestión</div>

        <div className="user-box">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-email">{displayEmail}</div>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/dashboard" className={navLinkClass}>
          <span className="material-symbols-rounded icon" aria-hidden="true">
            home
          </span>
          <span>Dashboard Principal</span>
        </NavLink>

        {/* Usuarios */}
        {canSeeModule("usuarios") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.usuarios)}
              onClick={() => toggle("usuarios")}
              aria-expanded={open.usuarios}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                person
              </span>
              <span>Gestión de Usuarios</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>
            <div className={itemsClass(open.usuarios)}>
              {canSeeSub("usuarios") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.usuarios}
                  className={navLinkClass}
                >
                  Usuarios
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Servicios */}
        {canSeeModule("servicios") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.servicios)}
              onClick={() => toggle("servicios")}
              aria-expanded={open.servicios}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                handyman
              </span>
              <span>Gestión de Servicios</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>
            <div className={itemsClass(open.servicios)}>
              {canSeeSub("categoriaservicios") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.categoriaservicios}
                  className={navLinkClass}
                >
                  Categorías Servicios
                </NavLink>
              )}
              {canSeeSub("servicios") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.servicios}
                  className={navLinkClass}
                >
                  Servicios
                </NavLink>
              )}
              {canSeeSub("agendacitas") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.agendacitas}
                  className={navLinkClass}
                >
                  Agendamiento de Citas
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Compras */}
        {canSeeModule("compras") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.compras)}
              onClick={() => toggle("compras")}
              aria-expanded={open.compras}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                shopping_cart
              </span>
              <span>Gestión de Compras</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={itemsClass(open.compras)}>
              {canSeeSub("proveedor") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.proveedor}
                  className={navLinkClass}
                >
                  Proveedor
                </NavLink>
              )}
              {canSeeSub("productos") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.productos}
                  className={navLinkClass}
                >
                  Productos
                </NavLink>
              )}
              {canSeeSub("pedidos") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.pedidos}
                  className={navLinkClass}
                >
                  Pedidos
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Ventas */}
        {canSeeModule("ventas") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.ventas)}
              onClick={() => toggle("ventas")}
              aria-expanded={open.ventas}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                sell
              </span>
              <span>Gestión de Ventas</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={itemsClass(open.ventas)}>
              {canSeeSub("metodospago") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.metodospago}
                  className={navLinkClass}
                >
                  Métodos de Pago
                </NavLink>
              )}
              {canSeeSub("cotizaciones") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.cotizaciones}
                  className={navLinkClass}
                >
                  Cotizaciones
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Evaluación */}
        {canSeeModule("evaluacion") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.evaluacion)}
              onClick={() => toggle("evaluacion")}
              aria-expanded={open.evaluacion}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                grade
              </span>
              <span>Evaluación Cliente</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={itemsClass(open.evaluacion)}>
              {canSeeSub("evaluacionservicios") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.evaluacionservicios}
                  className={navLinkClass}
                >
                  Evaluación de Servicios
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Vehículos */}
        {canSeeModule("vehiculos") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.vehiculos)}
              onClick={() => toggle("vehiculos")}
              aria-expanded={open.vehiculos}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                directions_car
              </span>
              <span>Gestión de Vehículos</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={itemsClass(open.vehiculos)}>
              {canSeeSub("vehiculo") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.vehiculo}
                  className={navLinkClass}
                >
                  Vehículos
                </NavLink>
              )}
              {canSeeSub("tipovehiculo") && (
                <NavLink
                  to={SUBROUTE_BY_SUBKEY.tipovehiculo}
                  className={navLinkClass}
                >
                  Tipo Vehículos
                </NavLink>
              )}
              {canSeeSub("marca") && (
                <NavLink to={SUBROUTE_BY_SUBKEY.marca} className={navLinkClass}>
                  Marca
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Configuración */}
        {canSeeModule("configuracion") && (
          <div className="nav-category">
            <button
              type="button"
              className={catHeaderClass(open.configuracion)}
              onClick={() => toggle("configuracion")}
              aria-expanded={open.configuracion}
            >
              <span className="material-symbols-rounded icon" aria-hidden="true">
                settings
              </span>
              <span>Configuración</span>
              <span className="material-symbols-rounded arrow" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={itemsClass(open.configuracion)}>
              {canSeeSub("roles") && (
                <NavLink to={SUBROUTE_BY_SUBKEY.roles} className={navLinkClass}>
                  Roles
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="logout-section">
        <button className="logout" onClick={handleLogout}>
          <span className="material-symbols-rounded icon" aria-hidden="true">
            logout
          </span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
