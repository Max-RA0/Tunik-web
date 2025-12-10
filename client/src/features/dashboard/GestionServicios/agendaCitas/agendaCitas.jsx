import React, { useEffect, useMemo, useState } from "react";
import "./agendacitas.styles.css";

const API_AG = "https://tunik-api.onrender.com/api/agendacitas";
const API_VEH = "https://tunik-api.onrender.com/api/vehiculos";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Formatea para <input type="datetime-local"> usando HORA LOCAL (no UTC)
function formatDateInputLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// Muestra fecha (YYYY-MM-DD) en local
function formatDateDisplayLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AgendaCitas() {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    placa: "",
    fecha: "",
    estado: "Pendiente",
  });

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // modal ver
  const [openView, setOpenView] = useState(false);
  const [viewCita, setViewCita] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const token = localStorage.getItem("token");

  const showAlert = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 3000);
  };

  const limpiarFormulario = () => {
    setForm({
      placa: "",
      fecha: "",
      estado: "Pendiente",
    });
  };

  async function fetchCitas() {
    setLoading(true);
    try {
      const res = await fetch(API_AG, {
        headers: { ...authHeaders(token) },
      });
      const data = await res.json();
      if (data?.ok) {
        setCitas(data.data || []);
      } else {
        setCitas([]);
        showAlert("info", data?.msg || "No se encontraron citas");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error cargando citas");
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehiculos() {
    try {
      const res = await fetch(API_VEH, {
        headers: { ...authHeaders(token) },
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setVehiculos(arr);
    } catch (err) {
      console.error(err);
      setVehiculos([]);
    }
  }

  useEffect(() => {
    fetchCitas();
    fetchVehiculos();
    // ❌ Eliminado fetchCotizaciones(): tu model/controller no usa cotizaciones
  }, []);

  /* ------------ CRUD ------------- */
  function onNew() {
    setEditId(null);
    limpiarFormulario();
    setOpenForm(true);
  }

  async function onEdit(id) {
    try {
      const res = await fetch(`${API_AG}/${id}`, {
        headers: { ...authHeaders(token) },
      });
      const data = await res.json();
      const c = data?.data;
      if (!c) return showAlert("error", "No se pudo leer la cita");

      setEditId(c.idagendacitas);
      setForm({
        placa: c.placa,
        fecha: formatDateInputLocal(c.fecha), // ✅ local (no UTC)
        estado: c.estado || "Pendiente",
      });
      setOpenForm(true);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error leyendo la cita");
    }
  }

  function onView(c) {
    setViewCita(c);
    setOpenView(true);
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`${API_AG}/${deleteId}`, {
        method: "DELETE",
        headers: { ...authHeaders(token) },
      });
      const data = await res.json();
      if (data?.ok) {
        showAlert("exito", "Cita eliminada correctamente");
        setOpenDelete(false);
        setDeleteId(null);
        fetchCitas();
      } else {
        showAlert("error", data?.msg || "No se pudo eliminar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al eliminar");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.placa) return showAlert("error", "Selecciona una placa");
    if (!form.fecha) return showAlert("error", "Selecciona una fecha y hora");

    // ✅ Enviar la fecha TAL CUAL viene del datetime-local (local)
    // Evita toISOString() para que no te corra la hora por zona horaria
    const payload = {
      placa: form.placa,
      fecha: form.fecha,          // ✅ local datetime
      estado: form.estado || "Pendiente", // ✅ envía estado
    };

    try {
      const url = editId ? `${API_AG}/${editId}` : API_AG;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.ok) {
        showAlert("exito", editId ? "Cita actualizada" : "Cita creada");
        setOpenForm(false);
        setEditId(null);
        limpiarFormulario();
        fetchCitas();
      } else {
        showAlert("error", data?.msg || "Error al guardar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al guardar");
    }
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ------------ Filtro + paginación ------------- */
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return citas;
    return citas.filter((c) =>
      `${c.idagendacitas} ${c.placa} ${c.estado}`.toLowerCase().includes(s)
    );
  }, [citas, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reset de página al buscar / o si la página queda fuera de rango
  useEffect(() => setPage(1), [search]);
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  /* ------------ UI ------------- */
  return (
    <div className="roles-page">
      <header className="header">
        <h1>Agendamiento de Citas</h1>
        <div className="header-actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              placeholder="Buscar por id, placa o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn primary" onClick={fetchCitas}>
            <span className="material-symbols-rounded">refresh</span>
            Recargar
          </button>
          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span>
            Registrar nueva cita
          </button>
        </div>
      </header>

      {alerta.mensaje && (
        <div
          className={`alerta ${
            alerta.tipo === "error"
              ? "alerta-error"
              : alerta.tipo === "exito"
              ? "alerta-exito"
              : "alerta-info"
          }`}
        >
          {alerta.mensaje}
        </div>
      )}

      <div className="tables-container">
        <table>
          <thead>
            <tr>
              <th>ID Agendamiento</th>
              <th>Placa</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  Sin registros
                </td>
              </tr>
            ) : (
              pageItems.map((c) => (
                <tr key={c.idagendacitas}>
                  <td>{`A${c.idagendacitas}`}</td>
                  <td>{c.placa}</td>
                  <td>{formatDateDisplayLocal(c.fecha)}</td>
                  <td>
                    <span
                      className={`estado-dot ${
                        c.estado === "Pendiente"
                          ? "estado-pendiente"
                          : c.estado === "Realizada"
                          ? "estado-aprobado"
                          : "estado-cancelada"
                      }`}
                    />
                    {c.estado}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-view"
                        type="button"
                        onClick={() => onView(c)}
                      >
                        <span className="material-symbols-rounded">visibility</span>
                        Ver
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => onEdit(c.idagendacitas)}
                      >
                        <span className="material-symbols-rounded">edit</span>
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => askDelete(c.idagendacitas)}
                      >
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

        {/* paginación (si aplica) */}
        {filtered.length > pageSize ? (
          <div className="pagination" style={{ display: "flex", justifyContent: "center", gap: 8, padding: "14px 0" }}>
            <button
              className="btn"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`btn ${n === page ? "primary" : ""}`}
                type="button"
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              className="btn"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      {/* Modal ver */}
      {openView && viewCita && (
        <div
          className="modal show"
          onClick={(e) =>
            e.target.classList.contains("modal") && setOpenView(false)
          }
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">
                Detalle cita A{viewCita.idagendacitas}
              </div>
              <button className="close-btn" onClick={() => setOpenView(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Placa:</strong> {viewCita.placa}
              </p>
              <p>
                <strong>Vehículo:</strong>{" "}
                {viewCita.vehiculo?.modelo || "N/A"}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDateDisplayLocal(viewCita.fecha)}
              </p>
              <p>
                <strong>Estado:</strong> {viewCita.estado}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setOpenView(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {openDelete && (
        <div
          className="modal show"
          onClick={(e) =>
            e.target.classList.contains("modal") && setOpenDelete(false)
          }
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">
                Confirmar eliminación de cita #{deleteId}
              </div>
              <button
                className="close-btn"
                onClick={() => setOpenDelete(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>¿Seguro que deseas eliminar esta cita?</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setOpenDelete(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {openForm && (
        <div
          className="modal show"
          onClick={(e) =>
            e.target.classList.contains("modal") && setOpenForm(false)
          }
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">
                {editId ? "Editar cita" : "Registrar cita"}
              </div>
              <button className="close-btn" onClick={() => setOpenForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Placa</label>
                  <select
                    name="placa"
                    value={form.placa}
                    onChange={onFormChange}
                    required
                  >
                    <option value="">Selecciona un vehículo</option>
                    {vehiculos.map((v) => (
                      <option key={v.placa} value={v.placa}>
                        {v.placa} - {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Fecha y hora</label>
                  <input
                    type="datetime-local"
                    name="fecha"
                    value={form.fecha}
                    onChange={onFormChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={onFormChange}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setOpenForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  <span className="material-symbols-rounded">check</span>
                  {editId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
