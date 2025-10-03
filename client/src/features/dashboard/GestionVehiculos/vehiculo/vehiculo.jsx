import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./vehiculos.styles.css";

const API_URL = "http://localhost:3000/api/vehiculos";
const TIPOS_URL = "http://localhost:3000/api/tipovehiculos";
const MARCAS_URL = "http://localhost:3000/api/marcas";
const USUARIOS_URL = "http://localhost:3000/api/usuarios";

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    placa: "",
    modelo: "",
    color: "",
    idtipovehiculos: "",
    idmarca: "",
    cedula: "",
  });

  // Cargar listas y vehiculos
  async function fetchAll() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const [vehiculosRes, tiposRes, marcasRes, usuariosRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(TIPOS_URL),
        axios.get(MARCAS_URL),
        axios.get(USUARIOS_URL),
      ]);

      const vRaw = vehiculosRes?.data;
      setVehiculos(Array.isArray(vRaw) ? vRaw : (vRaw?.data || []));

      const tRaw = tiposRes?.data;
      setTipos(Array.isArray(tRaw) ? tRaw : (tRaw?.data || []));

      const mRaw = marcasRes?.data;
      setMarcas(Array.isArray(mRaw) ? mRaw : (mRaw?.data || []));

      const uRaw = usuariosRes?.data;
      setUsuarios(Array.isArray(uRaw) ? uRaw : (uRaw?.data || []));

      setMsg("Vehículos cargados: " + (Array.isArray(vRaw) ? vRaw.length : (vRaw?.data?.length || 0)));
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  // Registrar vehículo
  const handleRegistrar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(API_URL, {
        placa: (nuevoVehiculo.placa || "").trim(),
        modelo: (nuevoVehiculo.modelo || "").trim(),
        color: (nuevoVehiculo.color || "").trim(),
        idtipovehiculos: Number(nuevoVehiculo.idtipovehiculos),
        idmarca: Number(nuevoVehiculo.idmarca),
        cedula: (nuevoVehiculo.cedula || "").trim(),
      });
      setMsg("Vehículo registrado");
      setNuevoVehiculo({
        placa: "",
        modelo: "",
        color: "",
        idtipovehiculos: "",
        idmarca: "",
        cedula: "",
      });
      setMostrarForm(false);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error registrando vehículo");
    }
  };

  // Filtro cliente
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return vehiculos;
    return vehiculos.filter((v) =>
      (v.placa || "").toLowerCase().includes(q) ||
      (v.modelo || "").toLowerCase().includes(q) ||
      (v.color || "").toLowerCase().includes(q)
    );
  }, [vehiculos, search]);

  return (
    <div className="vehiculos-page">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">Vehículos</h1>
          <div className="subtitle">Gestión de vehículos registrados</div>
        </div>

        <div className="actions">
          <div className="search-wrapper" role="search" aria-label="Buscar vehículos">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por placa, modelo o color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") {/* noop */} }}
            />
          </div>

          <button className="btn" onClick={() => fetchAll()}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={() => setMostrarForm(true)}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar vehículo
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando vehículos…</p>}
        {!loading && msg ? <p className="note">{msg}</p> : null}
        {error ? <p className="note error">{error}</p> : null}

        {/* Tabla */}
        <table className="table" role="table" aria-label="Tabla de vehículos">
          <thead>
            <tr>
              <th scope="col">Placa</th>
              <th scope="col">Modelo</th>
              <th scope="col">Color</th>
              <th scope="col">Tipo</th>
              <th scope="col">Marca</th>
              <th scope="col">Usuario</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No hay vehículos registrados
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.placa}>
                  <td style={{ fontWeight: 700 }}>{v.placa}</td>
                  <td>{v.modelo}</td>
                  <td>{v.color}</td>
                  <td>{v.tipo?.nombre || v.tipovehiculo?.nombre || v.nombre || "N/A"}</td>
                  <td>{v.marca?.descripcion || v.descripcion || "N/A"}</td>
                  <td>{v.usuario?.cedula || v.cedula}</td>
                  <td>
                    <span className="pill">
                      <span className="pill-dot"></span>
                      <span className="pill-text">Activo</span>
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" title="Editar" onClick={() => alert("Edición no implementada aún en este módulo")}>
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" title="Eliminar" onClick={() => alert("Eliminación no implementada aún en este módulo")}>
                        <span className="material-symbols-rounded" aria-hidden="true">delete</span>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR */}
      {mostrarForm ? (
        <div
          className="modal show"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("modal")) setMostrarForm(false); }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="modalTitle">Registrar vehículo</div>
                <div className="modal-sub">Completa los datos del vehículo</div>
              </div>
              <button type="button" className="close-x" aria-label="Cerrar" onClick={() => setMostrarForm(false)}>&times;</button>
            </div>

            <form onSubmit={handleRegistrar}>
              <div className="modal-body">
                <div style={{ gridColumn: "1 / span 1" }}>
                  <label htmlFor="vPlaca">Placa</label>
                  <input
                    id="vPlaca"
                    type="text"
                    placeholder="Ej: ABC123"
                    value={nuevoVehiculo.placa}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, placa: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vModelo">Modelo</label>
                  <input
                    id="vModelo"
                    type="text"
                    placeholder="Ej: 2020"
                    value={nuevoVehiculo.modelo}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vColor">Color</label>
                  <input
                    id="vColor"
                    type="text"
                    placeholder="Ej: Rojo"
                    value={nuevoVehiculo.color}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vTipo">Tipo de vehículo</label>
                  <select
                    id="vTipo"
                    value={nuevoVehiculo.idtipovehiculos}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, idtipovehiculos: e.target.value })}
                    required
                  >
                    <option value="">Seleccione tipo</option>
                    {tipos.map((t) => (
                      <option key={t.idtipovehiculos} value={t.idtipovehiculos}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="vMarca">Marca</label>
                  <select
                    id="vMarca"
                    value={nuevoVehiculo.idmarca}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, idmarca: e.target.value })}
                    required
                  >
                    <option value="">Seleccione marca</option>
                    {marcas.map((m) => (
                      <option key={m.idmarca} value={m.idmarca}>
                        {m.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="vUsuario">Usuario (cédula)</label>
                  <select
                    id="vUsuario"
                    value={nuevoVehiculo.cedula}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, cedula: e.target.value })}
                    required
                  >
                    <option value="">Seleccione usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.cedula} value={u.cedula}>
                        {u.cedula} - {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {error ? <div style={{ gridColumn: "1 / -1", color: "#be1e2d", fontWeight: 600 }}>{error}</div> : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn dark" onClick={(e) => e.currentTarget.form?.requestSubmit()}>
                  <span className="material-symbols-rounded" aria-hidden="true">check</span>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
