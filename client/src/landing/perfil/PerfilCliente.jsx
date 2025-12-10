import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import HeaderCliente from "../../Components/cliente/HeaderCliente";
import FooterCliente from "../../Components/cliente/FooterCliente";
import "./perfilCliente.css";

const API = "http://localhost:3000/api";
const USERS_URL = `${API}/usuarios`;

function safeUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function pick(u, keys, fallback = "") {
  for (const k of keys) {
    const v = u?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function roleName(u) {
  const r = u?.rol ?? u?.roles;
  if (!r) return "Cliente";
  if (typeof r === "string") return r;
  return r.descripcion || r.nombre || r.name || "Cliente";
}

export default function PerfilCliente() {
  const local = useMemo(() => safeUser(), []);
  const numero_documento = useMemo(
    () =>
      String(
        pick(local, ["numero_documento", "numeroDocumento", "documento", "cedula"], "")
      ),
    [local]
  );

  const [userDb, setUserDb] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  async function fetchUserFromDb() {
    if (!numero_documento) return;
    setLoading(true);
    try {
      // Preferido: /api/usuarios/:id
      const { data } = await axios.get(`${USERS_URL}/${numero_documento}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = data?.data ?? data?.usuario ?? data;
      setUserDb(payload && typeof payload === "object" ? payload : null);
    } catch (e) {
      // fallback: por si tu backend usa query (?numero_documento=)
      try {
        const { data } = await axios.get(`${USERS_URL}`, {
          params: { numero_documento },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const list = data?.data ?? data ?? [];
        const one = Array.isArray(list) ? list[0] : list;
        setUserDb(one && typeof one === "object" ? one : null);
      } catch {
        setUserDb(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero_documento]);

  const u = userDb || local || {};

  const nombre = pick(u, ["nombre", "nombres", "name", "username"], "Cliente");
  const email = pick(u, ["email", "correo"], "");
  const telefono = pick(u, ["telefono", "celular", "phone", "telefono_usuario"], "");
  const tipo_documento = pick(u, ["tipo_documento", "tipoDocumento"], "");
  const rol = roleName(u);

  const initials = String(nombre || "CL")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  return (
    <div className="perfil-page">
      <HeaderCliente />

      <div className="container py-5">
        <div className="perfil-hero">
          <div className="perfil-hero-left">
            <div className="perfil-avatar">{initials}</div>
            <div>
              <h2 className="perfil-title">Mi perfil</h2>
              <div className="perfil-sub">
                <strong>{String(nombre).toUpperCase()}</strong>
                <span className="perfil-badge">{String(rol).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <button
            className="perfil-refresh"
            type="button"
            onClick={fetchUserFromDb}
            disabled={loading}
            title="Actualizar datos"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div className="perfil-card mt-4">
          <h3 className="perfil-card-title">Datos principales</h3>

          <div className="perfil-grid">
            <div className="perfil-row">
              <span className="perfil-label">Número de documento</span>
              <span className="perfil-value">{numero_documento || "-"}</span>
            </div>

            {tipo_documento ? (
              <div className="perfil-row">
                <span className="perfil-label">Tipo de documento</span>
                <span className="perfil-value">{String(tipo_documento).toUpperCase()}</span>
              </div>
            ) : null}

            <div className="perfil-row">
              <span className="perfil-label">Nombre</span>
              <span className="perfil-value">{nombre || "-"}</span>
            </div>

            <div className="perfil-row">
              <span className="perfil-label">Email</span>
              <span className="perfil-value">{email || "-"}</span>
            </div>

            <div className="perfil-row">
              <span className="perfil-label">Teléfono</span>
              <span className="perfil-value">{telefono || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <FooterCliente />
    </div>
  );
}
