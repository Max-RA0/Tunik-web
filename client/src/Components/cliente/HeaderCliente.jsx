import React, { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./HeaderCliente.css";

function safeUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function getNombre(usuario) {
  if (!usuario || typeof usuario !== "object") return "Cliente";
  return (
    usuario.nombre ||
    usuario.nombres ||
    usuario.name ||
    usuario.username ||
    usuario.email ||
    "Cliente"
  );
}

export default function HeaderCliente() {
  const navigate = useNavigate();
  const usuario = useMemo(() => safeUser(), []);
  const isLogged = !!usuario;
  const nombre = getNombre(usuario);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("acl");
    navigate("/", { replace: true });
  };

  const navBtn = ({ isActive }) =>
    `btn btn-register btn-auth btn-nav ${isActive ? "is-active" : ""}`;

  return (
    <nav className="navbar navbar-dark tunik-navbar">
      <div className="tunik-container">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/cliente">
          <i className="bi bi-car-front-fill me-2" />
          <span className="brand-text">Tunik</span>
        </Link>

        {/* Acciones (todo en 1 línea, dentro del container) */}
        <div className="tunik-actions">
          {isLogged ? (
            <>
              {/* HOLA al inicio */}
              <span className="btn btn-register btn-auth tunik-userpill">
                HOLA, {String(nombre).toUpperCase()}
              </span>

              {/* Botones del cliente (mismo diseño) */}
              <div className="tunik-navgroup">
                <NavLink to="/cliente/perfil" className={navBtn}>
                  VER PERFIL
                </NavLink>

                <NavLink to="/cliente/agendamiento" className={navBtn}>
                  AGENDAR CITA
                </NavLink>

                <NavLink to="/cliente/evaluacion" className={navBtn}>
                  CALIFICAR SERVICIO
                </NavLink>
                
                <NavLink to="/cliente/vehiculos" className="btn btn-register btn-auth">
                  Registrar Vehiculo
                </NavLink>
              </div>

              {/* SALIR al final */}
              <button
                type="button"
                className="btn btn-login btn-auth tunik-logout"
                onClick={logout}
              >
                SALIR
              </button>
            </>
          ) : (
            <>
              <Link to="/registrarse" className="btn btn-register btn-auth">
                Registrarse
              </Link>
              <Link to="/" className="btn btn-login btn-auth">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
