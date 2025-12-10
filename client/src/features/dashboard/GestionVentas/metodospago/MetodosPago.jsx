// src/pages/MetodosPago.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./metodospago.styles.css";

const API_URL = "https://tunik-api.onrender.com/api/metodospago";

/* ------------------- Normalizadores tolerantes ------------------- */
function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.idmpago ?? raw.id ?? raw.Id ?? null;
  const nombre =
    raw.nombremetodo ??
    raw.nombre ??
    raw.metodo ??
    raw.Nombre ??
    raw.NombreMetodo ??
    "";
  if (id == null) return null;
  return { idmpago: Number(id), nombremetodo: String(nombre) };
}

function extractMany(res) {
  const d = res?.data ?? null;
  let arr = null;
  if (Array.isArray(d)) arr = d;
  else if (d?.data && Array.isArray(d.data)) arr = d.data;
  else if (d?.rows && Array.isArray(d.rows)) arr = d.rows;
  else if (d?.items && Array.isArray(d.items)) arr = d.items;
  if (!arr) return [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const n = normalizeItem(arr[i]);
    if (n) {
      const exists = out.some((o) => o.idmpago === n.idmpago);
      if (!exists) out.push(n);
    }
  }
  return out;
}

function extractOne(res) {
  const d = res?.data ?? null;
  const candidates = [];
  if (d && typeof d === "object") {
    if (d.data != null) candidates.push(d.data);
    if (d.item != null) candidates.push(d.item);
  }
  if (d) candidates.push(d);
  if (d?.rows && Array.isArray(d.rows) && d.rows.length > 0) candidates.push(d.rows[0]);
  if (Array.isArray(d) && d.length > 0) candidates.push(d[0]);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (Array.isArray(c)) {
      for (let j = 0; j < c.length; j++) {
        const n = normalizeItem(c[j]);
        if (n) return n;
      }
    } else {
      const n2 = normalizeItem(c);
      if (n2) return n2;
    }
  }
  return null;
}

/* ----------------------------- Componente ----------------------------- */
export default function MetodosPago() {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [idmpago, setIdmpago] = useState("");
  const [nombremetodo, setNombremetodo] = useState("");
  const isEdit = Boolean(idmpago);
  const formRef = useRef(null);

  // validación
  const [formErrors, setFormErrors] = useState({ nombre: "" });
  const [touched, setTouched] = useState({ nombre: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const RULES = {
    nombre: { required: true, min: 2, max: 100 }
  };

  function validateNombre(v) {
    const s = (v || "").trim();
    if (RULES.nombre.required && s.length === 0) return "Ingresa el nombre del método";
    if (s.length < RULES.nombre.min) return `El nombre debe tener al menos ${RULES.nombre.min} caracteres`;
    if (s.length > RULES.nombre.max) return `El nombre no puede superar ${RULES.nombre.max} caracteres`;
    return "";
  }

  function validateForm(values = {}) {
    return {
      nombre: validateNombre(values.nombre !== undefined ? values.nombre : nombremetodo)
    };
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    // no setMsg here to avoid showing pill on regular reload/search
    try {
      const res = await axios.get(API_URL);
      const list = extractMany(res);
      setMetodos(list);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando métodos de pago");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  /* --------- Crear / Editar --------- */
  function onNew() {
    setIdmpago("");
    setNombremetodo("");
    setError("");
    setMsg("");
    setFormErrors({ nombre: "" });
    setTouched({ nombre: false });
    setOpenForm(true);
    setTimeout(() => {
      formRef.current?.querySelector("#nombreMetodo")?.focus();
    }, 0);
  }

  async function onEdit(id) {
    setError("");
    // no setMsg to avoid showing pill when opening edit modal
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      const item = extractOne(res);
      if (!item) {
        setError("No se pudo leer el método desde la API.");
        return;
      }
      setIdmpago(item.idmpago);
      setNombremetodo(item.nombremetodo || "");
      setFormErrors({ nombre: "" });
      setTouched({ nombre: false });
      setOpenForm(true);
      setTimeout(() => {
        formRef.current?.querySelector("#nombreMetodo")?.focus();
      }, 0);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const nombre = (nombremetodo || "").trim();

    // validar
    const errors = validateForm({ nombre });
    setFormErrors(errors);
    setTouched({ nombre: true });

    if (errors.nombre) return;

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${idmpago}`, { nombremetodo: nombre });
        setMsg("Método actualizado");
      } else {
        await axios.post(API_URL, { nombremetodo: nombre });
        setMsg("Método creado");
      }
      setOpenForm(false);
      setIdmpago("");
      setNombremetodo("");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /* --------- Eliminar --------- */
  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }
  async function confirmDelete() {
    setError("");
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      // no setMsg here to avoid showing pill on delete
      setOpenDelete(false);
      setDeleteId(null);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  /* --------- Filtro y paginación --------- */
  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return metodos.filter((m) =>
      (m?.nombremetodo ? String(m.nombremetodo).toLowerCase() : "").includes(s)
    );
  }, [metodos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // handlers para validación onChange/onBlur
  function handleNombreChange(v) {
    setNombremetodo(v);
    if (touched.nombre) setFormErrors((p) => ({ ...p, nombre: validateNombre(v) }));
  }
  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "nombre") setFormErrors((p) => ({ ...p, nombre: validateNombre(nombremetodo) }));
  }

  // búsqueda simplificada: quitamos setMsg para no mostrar pill
  async function handleSearchKeyEnterLoadAll(e) {
    if (e.key === "Enter") {
      await loadAll();
    }
  }

  return (
    <div className="mp-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>Métodos de Pago</h1>
        </div>

        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar método">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={handleSearchKeyEnterLoadAll}
            />
          </div>

          <button className="btn primary" onClick={loadAll} disabled={loading}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar método
          </button>
        </div>
      </header>

      {loading && <p style={{ padding: "12px 32px" }}>Cargando métodos…</p>}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      {/* Tabla */}
      <div className="table-wrap">
        <table className="table" role="table" aria-label="Tabla de métodos de pago">
          <thead>
            <tr>
              <th scope="col" style={{ width: 120 }}>ID</th>
              <th scope="col">Nombre</th>
              <th scope="col" style={{ width: 260 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageItems.map((m) => (
                <tr key={m.idmpago}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{m.idmpago}</td>
                  <td style={{ color: "#374151" }}>{m.nombremetodo}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => onEdit(m.idmpago)}>
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(m.idmpago)}>
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

        {/* Paginación */}
        {filtered.length > pageSize ? (
          <div className="pagination-container" aria-label="Paginación">
            <div className="pagination-bar" role="navigation" aria-label="Controles de paginación">
              <button
                className="page-btn"
                aria-label="Anterior"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀
              </button>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const within = n >= page - 2 && n <= page + 2;
                  const show = n === 1 || n === totalPages || within;
                  if (!show) return null;
                  return (
                    <button
                      key={n}
                      className={`page-btn ${page === n ? "active" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button
                className="page-btn"
                aria-label="Siguiente"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ▶
              </button>
            </div>
          </div>
        ) : null}
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
                <div className="modal-title" id="modalTitle">
                  {isEdit ? "Editar Método" : "Registrar Método"}
                </div>
                <div className="modal-sub">
                  {isEdit ? `Editando #${idmpago}` : "Crear nuevo método de pago"}
                </div>
              </div>
              <button className="close-x" aria-label="Cerrar" onClick={() => setOpenForm(false)}>
                &times;
              </button>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
              <div className="modal-body">
                <label htmlFor="nombreMetodo">Nombre del método</label>
                <input
                  id="nombreMetodo"
                  type="text"
                  placeholder="Ej: Efectivo, Tarjeta, Transferencia"
                  value={nombremetodo}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  onBlur={() => handleBlur("nombre")}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); formRef.current?.requestSubmit(); } }}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(formErrors.nombre)}
                  maxLength={RULES.nombre.max}
                />
                {touched.nombre && formErrors.nombre ? (
                  <div className="field-error" role="alert" style={{ color: "var(--danger)", marginTop: 6 }}>{formErrors.nombre}</div>
                ) : (
                  <div className="field-help" style={{ color: "#6b7280", marginTop: 6 }}>{`Min ${RULES.nombre.min}, max ${RULES.nombre.max} caracteres.`}</div>
                )}
                {error ? <p className="note error" style={{ marginTop: 6 }}>{error}</p> : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  <span className="material-symbols-rounded" aria-hidden="true">check</span>
                  {isSubmitting ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar" : "Guardar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL ELIMINAR */}
      {openDelete ? (
        <div
          className="modal show"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("modal")) setOpenDelete(false); }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="deleteTitle">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button className="close-x" aria-label="Cerrar" onClick={() => setOpenDelete(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p>¿Eliminar el método #{deleteId}?</p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenDelete(false)}>Cancelar</button>
              <button className="row-btn danger" onClick={confirmDelete}>
                <span className="material-symbols-rounded" aria-hidden="true">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
