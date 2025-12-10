// features/dashboard/GestionVehiculos/vehiculo/Vehiculos.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./vehiculos.styles.css";

const API_URL = "https://tunik-api.onrender.com/api/vehiculos";
const TIPOS_URL = "https://tunik-api.onrender.com/api/tipovehiculos";
const MARCAS_URL = "https://tunik-api.onrender.com/api/marcas";
const USUARIOS_URL = "https://tunik-api.onrender.com/api/usuarios";

const EMPTY_FORM = {
  placa: "",
  modelo: "",
  color: "",
  idtipovehiculos: "",
  idmarca: "",
  numero_documento: "",
};

function normalizePlaca(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").trim();
}

function getTipoNombre(tipos, id) {
  const t = tipos.find((x) => String(x.idtipovehiculos) === String(id));
  return (t?.nombre || "").toLowerCase();
}

// Carro/Camioneta: AAA123
const PLACA_CARRO = /^[A-Z]{3}\d{3}$/;
// Moto (Colombia): ABC12D (3 letras + 2 números + 1 letra)
const PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ feedback (SOLO modal)
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [vehiculoEditar, setVehiculoEditar] = useState(null);

  const [nuevoVehiculo, setNuevoVehiculo] = useState(EMPTY_FORM);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const clearFeedback = () => {
    setMsg("");
    setError("");
  };

  // ==============================
  // 🔹 Cargar datos
  // ==============================
  async function fetchAll() {
    setLoading(true);
    clearFeedback();
    try {
      const [vehiculosRes, tiposRes, marcasRes, usuariosRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(TIPOS_URL),
        axios.get(MARCAS_URL),
        axios.get(USUARIOS_URL),
      ]);

      const vRaw = vehiculosRes?.data;
      setVehiculos(Array.isArray(vRaw) ? vRaw : vRaw?.data || []);

      setTipos(Array.isArray(tiposRes.data) ? tiposRes.data : tiposRes.data?.data || []);
      setMarcas(Array.isArray(marcasRes.data) ? marcasRes.data : marcasRes.data?.data || []);
      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : usuariosRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // ==============================
  // 🔹 VALIDACIONES
  // ==============================
  const validarModelo = (modelo) => /^\d{4}$/.test(String(modelo || "").trim());
  const validarColor = (color) =>
    /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(String(color || "").trim());

  const validarPlacaPorTipo = (placaRaw, idtipovehiculos) => {
    const placa = normalizePlaca(placaRaw);
    const tipoNombre = getTipoNombre(tipos, idtipovehiculos);

    // si no hay tipo aún, por defecto carro (para no permitir cualquier cosa)
    if (!tipoNombre) return PLACA_CARRO.test(placa);

    if (tipoNombre.includes("moto")) return PLACA_MOTO.test(placa);
    return PLACA_CARRO.test(placa);
  };

  const getPlacaHint = (idtipovehiculos) => {
    const tipoNombre = getTipoNombre(tipos, idtipovehiculos);
    if (tipoNombre.includes("moto")) return "Ej: ABC12D (Moto)";
    return "Ej: ABC123 (Carro/Camioneta)";
  };

  const getPlacaError = (idtipovehiculos) => {
    const tipoNombre = getTipoNombre(tipos, idtipovehiculos);
    if (tipoNombre.includes("moto")) return "Para moto debe ser ABC12D (3 letras + 2 números + 1 letra).";
    return "Para carro/camioneta debe ser ABC123 (3 letras + 3 números).";
  };

  // ==============================
  // 🔹 GUARDAR / ACTUALIZAR
  // ==============================
  const handleRegistrar = async (e) => {
    e.preventDefault();
    clearFeedback();

    const placaNorm = normalizePlaca(nuevoVehiculo.placa);

    if (!nuevoVehiculo.idtipovehiculos) return setError("Selecciona el tipo de vehículo.");
    if (!validarPlacaPorTipo(placaNorm, nuevoVehiculo.idtipovehiculos))
      return setError(getPlacaError(nuevoVehiculo.idtipovehiculos));
    if (!validarModelo(nuevoVehiculo.modelo)) return setError("El modelo debe tener exactamente 4 dígitos numéricos.");
    if (!validarColor(nuevoVehiculo.color)) return setError("El color solo puede contener letras y espacios.");
    if (!nuevoVehiculo.idmarca) return setError("Selecciona la marca.");
    if (!nuevoVehiculo.numero_documento) return setError("Selecciona el usuario.");

    try {
      const payload = {
        placa: placaNorm,
        modelo: String(nuevoVehiculo.modelo).trim(),
        color: String(nuevoVehiculo.color).trim(),
        idtipovehiculos: Number(nuevoVehiculo.idtipovehiculos),
        idmarca: Number(nuevoVehiculo.idmarca),
        numero_documento: String(nuevoVehiculo.numero_documento).trim(),
      };

      if (editando) {
        // en edición la placa va por params, pero la mandamos igual por si tu backend la ignora
        await axios.put(`${API_URL}/${vehiculoEditar.placa}`, payload);
        setMsg("Vehículo actualizado correctamente");
      } else {
        await axios.post(API_URL, payload);
        setMsg("Vehículo registrado correctamente");
      }

      await fetchAll();
      setTimeout(() => cerrarModal(), 700);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error guardando vehículo");
    }
  };

  // ==============================
  // 🔹 ELIMINAR
  // ==============================
  const confirmDelete = async () => {
    clearFeedback();
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setMsg("Vehículo eliminado correctamente");
      setOpenDelete(false);
      setDeleteId(null);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error eliminando vehículo");
    }
  };

  const askDelete = (placa) => {
    clearFeedback();
    setDeleteId(placa);
    setOpenDelete(true);
  };

  // ==============================
  // 🔹 EDITAR
  // ==============================
  const handleEditar = (vehiculo) => {
    clearFeedback();
    setEditando(true);
    setVehiculoEditar(vehiculo);
    setNuevoVehiculo({
      placa: vehiculo.placa || "",
      modelo: vehiculo.modelo || "",
      color: vehiculo.color || "",
      idtipovehiculos: vehiculo.idtipovehiculos || vehiculo.tipo?.idtipovehiculos || "",
      idmarca: vehiculo.idmarca || vehiculo.marca?.idmarca || "",
      numero_documento: vehiculo.numero_documento || vehiculo.usuario?.numero_documento || "",
    });
    setMostrarForm(true);
  };

  // ==============================
  // 🔹 NUEVO FORMULARIO
  // ==============================
  const abrirFormularioNuevo = () => {
    clearFeedback();
    setEditando(false);
    setVehiculoEditar(null);
    setNuevoVehiculo(EMPTY_FORM);
    setMostrarForm(true);
  };

  // ==============================
  // 🔹 CERRAR MODAL Y LIMPIAR
  // ==============================
  const cerrarModal = () => {
    setMostrarForm(false);
    clearFeedback();
    setEditando(false);
    setVehiculoEditar(null);
    setNuevoVehiculo(EMPTY_FORM);
  };

  // ==============================
  // 🔹 FILTRO
  // ==============================
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return vehiculos;
    return vehiculos.filter(
      (v) =>
        (v.placa || "").toLowerCase().includes(q) ||
        (v.modelo || "").toLowerCase().includes(q) ||
        (v.color || "").toLowerCase().includes(q)
    );
  }, [vehiculos, search]);

  // ==============================
  // 🔹 RENDER
  // ==============================
  return (
    <div className="vehiculos-page">
      <header className="header">
        <div>
          <h1 className="title">Vehículos</h1>
          <div className="subtitle">Gestión de vehículos registrados</div>
        </div>

        <div className="actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por placa, modelo o color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn" onClick={fetchAll}>
            <span className="material-symbols-rounded">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={abrirFormularioNuevo}>
            <span className="material-symbols-rounded">add</span>
            Registrar vehículo
          </button>
        </div>
      </header>

      <div className="table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando vehículos…</p>}

        <table className="table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Acciones</th>
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
                  <td>{v.tipo?.nombre || "N/A"}</td>
                  <td>{v.marca?.descripcion || "N/A"}</td>
                  <td>{v.usuario?.numero_documento || v.numero_documento}</td>
                  <td>
                    <span className="pill">
                      <span className="pill-dot"></span>
                      <span className="pill-text">Activo</span>
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => handleEditar(v)}>
                        <span className="material-symbols-rounded">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(v.placa)}>
                        <span className="material-symbols-rounded">delete</span>
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

      {/* 🔴 MODAL ELIMINAR */}
      {openDelete && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenDelete(false)}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button type="button" className="close-x" onClick={() => setOpenDelete(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body modal-body-delete">
              <div style={{ fontSize: 16, color: "#111827" }}>Vas a eliminar el vehículo con placa:</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#be1e2d" }}>{deleteId}</div>
              <div style={{ color: "#6b7280" }}>Confirma que deseas eliminar este registro permanentemente.</div>

              {/* ✅ Alertas dentro del modal */}
              {error && <div className="alerta alerta-error">{error}</div>}
              {msg && <div className="alerta alerta-ok">{msg}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setOpenDelete(false)}>
                Cancelar
              </button>
              <button className="btn dark" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && cerrarModal()}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editando ? "Editar vehículo" : "Registrar vehículo"}</div>
                <div className="modal-sub">
                  {editando ? "Actualiza los datos del vehículo" : "Completa los datos del vehículo"}
                </div>
              </div>
              <button type="button" className="close-x" onClick={cerrarModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleRegistrar} autoComplete="off" key={editando ? `edit-${vehiculoEditar?.placa}` : "new"}>
              <div className="modal-body">
                <div className="form-col">
                  <label>Tipo de vehículo</label>
                  <select
                    value={nuevoVehiculo.idtipovehiculos}
                    onChange={(e) => {
                      clearFeedback();
                      setNuevoVehiculo({ ...nuevoVehiculo, idtipovehiculos: e.target.value });
                    }}
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

                <div className="form-col">
                  <label>Placa</label>
                  <input
                    type="text"
                    placeholder={getPlacaHint(nuevoVehiculo.idtipovehiculos)}
                    value={nuevoVehiculo.placa}
                    onChange={(e) => {
                      clearFeedback();
                      setNuevoVehiculo({ ...nuevoVehiculo, placa: normalizePlaca(e.target.value) });
                    }}
                    required
                    disabled={editando}
                    maxLength={6}
                  />
                </div>

                <div className="form-col">
                  <label>Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej: 2025"
                    value={nuevoVehiculo.modelo}
                    onChange={(e) => {
                      clearFeedback();
                      const val = e.target.value;
                      if (/^\d{0,4}$/.test(val)) setNuevoVehiculo({ ...nuevoVehiculo, modelo: val });
                    }}
                    required
                  />
                </div>

                <div className="form-col">
                  <label>Color</label>
                  <input
                    type="text"
                    placeholder="Ej: Rojo"
                    value={nuevoVehiculo.color}
                    onChange={(e) => {
                      clearFeedback();
                      setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value });
                    }}
                    required
                  />
                </div>

                <div className="form-col">
                  <label>Marca</label>
                  <select
                    value={nuevoVehiculo.idmarca}
                    onChange={(e) => {
                      clearFeedback();
                      setNuevoVehiculo({ ...nuevoVehiculo, idmarca: e.target.value });
                    }}
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

                <div className="form-col">
                  <label>Usuario (documento)</label>
                  <select
                    value={nuevoVehiculo.numero_documento}
                    onChange={(e) => {
                      clearFeedback();
                      setNuevoVehiculo({ ...nuevoVehiculo, numero_documento: e.target.value });
                    }}
                    required
                  >
                    <option value="">Seleccione usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.numero_documento} value={u.numero_documento}>
                        {u.numero_documento} - {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ Alertas dentro del modal (misma clase que Usuarios) */}
                {error && <div className="alerta alerta-error alerta-span">{error}</div>}
                {msg && <div className="alerta alerta-ok alerta-span">{msg}</div>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn dark">
                  <span className="material-symbols-rounded">check</span>
                  {editando ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
