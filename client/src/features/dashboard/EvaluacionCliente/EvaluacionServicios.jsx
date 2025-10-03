import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./evaluacion-servicios.styles.css";

const API = "http://localhost:3000/api";
const EV_URL = `${API}/evaluaciones`;
const USU_URL = `${API}/usuarios`;
const SER_URL = `${API}/servicios`;

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default function EvaluacionServicios() {
  // data
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal create/edit
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [cedula, setCedula] = useState("");
  const [idservicios, setIdservicios] = useState("");
  const [rating, setRating] = useState(0);

  const formRef = useRef(null);
  const isEdit = useMemo(() => Boolean(editId), [editId]);

  // modal delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // caches
  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.cedula), u));
    return m;
  }, [users]);

  const serviceById = useMemo(() => {
    const m = new Map();
    (services || []).forEach((s) => m.set(Number(s.idservicios), s));
    return m;
  }, [services]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const [evRes, uRes, sRes] = await Promise.all([
        axios.get(EV_URL),
        axios.get(USU_URL),
        axios.get(SER_URL),
      ]);

      const evList = (evRes?.data?.data || []).map((r) => ({
        ...r,
        calificacion:
          toInt(r.calificacion) ?? toInt(r.respuestacalificacion) ?? 0,
      }));
      setRows(evList);
      setUsers(uRes?.data?.data || uRes?.data || []);
      setServices(sRes?.data?.data || sRes?.data || []);
      setMsg(`Resultados: ${evList.length}`);
    } catch (e) {
      console.error(e);
      setError("Error cargando evaluaciones/usuarios/servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function resetForm() {
    setEditId(null);
    setCedula("");
    setIdservicios("");
    setRating(0);
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
    setTimeout(() => formRef.current?.querySelector("#selCedula")?.focus(), 0);
  }

  function onEdit(row) {
    setEditId(row.idevaluacion);
    setCedula(String(row.cedula));
    setIdservicios(String(row.idservicios));
    setRating(row.calificacion || 0);
    setOpenForm(true);
    setTimeout(() => formRef.current?.querySelector("#selCedula")?.focus(), 0);
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    setError("");
    try {
      const { data } = await axios.delete(`${EV_URL}/${deleteId}`);
      if (data?.ok) {
        setMsg("Evaluación eliminada");
        setOpenDelete(false);
        setDeleteId(null);
        fetchAll();
      } else {
        setError(data?.msg || "Error eliminando evaluación");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const r = toInt(rating);
    if (!cedula || !idservicios || !r || r < 1 || r > 5) {
      setError("Completa todos los campos y elige calificación 1–5.");
      return;
    }

    const payload = {
      cedula,
      idservicios: Number(idservicios),
      respuestacalificacion: r, // compat con nombre de columna
    };

    try {
      if (isEdit) {
        const { data } = await axios.put(`${EV_URL}/${editId}`, payload);
        if (!data?.ok) throw new Error(data?.msg || "Error actualizando");
        setMsg("Evaluación actualizada");
      } else {
        const { data } = await axios.post(EV_URL, payload);
        if (!data?.ok) throw new Error(data?.msg || "Error creando");
        setMsg("Evaluación creada");
      }
      setOpenForm(false);
      resetForm();
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error guardando");
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [
        r.idevaluacion,
        r.cedula,
        userById.get(String(r.cedula))?.nombre,
        serviceById.get(Number(r.idservicios))?.nombreservicios,
        r.calificacion,
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rows, search, userById, serviceById]);

  return (
    <div className="roles-page">{/* re-uso de la misma clase raíz para el mismo diseño */}
      <header className="header">
        <div className="header-left">
          <h1>Evaluación de Servicios</h1>
        </div>
        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar evaluación">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por usuario/servicio/cédula…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") fetchAll(); }}
            />
          </div>

          <button className="btn primary" onClick={fetchAll}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar evaluación
          </button>
        </div>
      </header>

      {loading && <p style={{ padding: "12px 32px" }}>Cargando…</p>}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      <div className="tables-container">
        <table role="table" aria-label="Tabla de evaluaciones">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Usuario (cédula)</th>
              <th scope="col">Servicio</th>
              <th scope="col">Calificación</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const u = userById.get(String(r.cedula));
                const s = serviceById.get(Number(r.idservicios));
                const cal = r.calificacion || 0;

                return (
                  <tr key={r.idevaluacion}>
                    <td style={{ fontWeight: 700, color: "#111827" }}>{r.idevaluacion}</td>
                    <td style={{ color: "#374151" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 700 }}>{u?.nombre || "-"}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{r.cedula}</span>
                      </div>
                    </td>
                    <td style={{ color: "#374151" }}>{s?.nombreservicios || `#${r.idservicios}`}</td>
                    <td>
                      <span style={{ color: "#f59e0b", fontWeight: 800 }}>
                        {"★".repeat(cal)}{"☆".repeat(Math.max(0, 5 - cal))}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn-edit" onClick={() => onEdit(r)} title="Editar">
                          <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                          Editar
                        </button>
                        <button className="btn-delete" onClick={() => askDelete(r.idevaluacion)} title="Eliminar">
                          <span className="material-symbols-rounded" aria-hidden="true">delete</span>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {openForm ? (
        <div
          className="modal show"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("modal")) setOpenForm(false); }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="modalTitle">{isEdit ? "Editar Evaluación" : "Registrar Nueva Evaluación"}</div>
                <div className="modal-sub">{isEdit ? `Editando #${editId}` : "Crear nueva calificación de servicio"}</div>
              </div>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setOpenForm(false)}>&times;</button>
            </div>

            <form ref={formRef} onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="modal-user">
                  <div className="avatar-small">EV</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Evaluación</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{isEdit ? `ID #${editId}` : "Nueva"}</div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="selCedula">Usuario (cédula)</label>
                  <select
                    id="selCedula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                  >
                    <option value="">Seleccione…</option>
                    {users.map((u) => (
                      <option key={u.cedula} value={u.cedula}>
                        {u.cedula} · {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="selServicio">Servicio</label>
                  <select
                    id="selServicio"
                    value={idservicios}
                    onChange={(e) => setIdservicios(e.target.value)}
                    required
                  >
                    <option value="">Seleccione…</option>
                    {services.map((s) => (
                      <option key={s.idservicios} value={s.idservicios}>
                        {s.idservicios} · {s.nombreservicios}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Calificación</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        style={{
                          fontSize: 26,
                          lineHeight: 1,
                          background: "transparent",
                          border: "1px solid rgba(31,41,55,.06)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          color: i <= rating ? "#f59e0b" : "#d1d5db",
                          cursor: "pointer",
                          fontWeight: 900
                        }}
                        aria-label={`${i} estrellas`}
                        title={`${i} estrellas`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {error ? <p className="note error" style={{ marginTop: 6 }}>{error}</p> : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  <span className="material-symbols-rounded" aria-hidden="true">check</span>
                  {isEdit ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL ELIMINAR */}
      {openDelete ? (
        <div
          className="modal modal-delete show"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("modal")) setOpenDelete(false); }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="deleteTitle">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setOpenDelete(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="modal-user">
                <div className="avatar-small">EV</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Evaluación</div>
                  <div style={{ fontSize: 13, color: "#666" }}>ID #{deleteId}</div>
                </div>
              </div>

              <div style={{ padding: "8px 4px 0 4px" }}>
                <p style={{ fontSize: 16, color: "#111827", marginBottom: 8 }}>Vas a eliminar la evaluación:</p>
                <p style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)", marginBottom: 12 }}>#{deleteId}</p>
                <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                  Confirma esta eliminación permanente.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel" onClick={() => setOpenDelete(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
