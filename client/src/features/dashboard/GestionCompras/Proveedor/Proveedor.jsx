// src/pages/Proveedor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./proveedor.styles.css";

const PRIMARY_API = "https://tunik-api.onrender.com/api/proveedores";
const FALLBACK_API = "https://tunik-api.onrender.com/api/proveedores-fallback";

/* ------------------- Normalizadores ------------------- */
function normalizeProveedor(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.idproveedor ?? raw.id ?? raw.Id ?? null;
  const nombre = raw.nombre ?? raw.Nombre ?? "";
  const telefono = raw.telefono ?? raw.Telefono ?? "";
  const correo = raw.correo ?? raw.Correo ?? "";
  const nombreempresa = raw.nombreempresa ?? raw.empresa ?? raw.Empresa ?? "";
  if (id == null) return null;
  return {
    idproveedor: Number(id),
    nombre: String(nombre),
    telefono: telefono == null ? "" : String(telefono),
    correo: String(correo),
    nombreempresa: String(nombreempresa),
  };
}

function extractMany(res) {
  const d = res?.data ?? null;
  let arr = null;
  if (Array.isArray(d)) arr = d;
  else if (d?.data && Array.isArray(d.data)) arr = d.data;
  else if (d?.rows && Array.isArray(d.rows)) arr = d.rows;
  else if (d && typeof d === "object") arr = [d];
  if (!arr) return [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const n = normalizeProveedor(arr[i]);
    if (n) {
      const exists = out.some((o) => o.idproveedor === n.idproveedor);
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
        const n = normalizeProveedor(c[j]);
        if (n) return n;
      }
    } else {
      const n2 = normalizeProveedor(c);
      if (n2) return n2;
    }
  }
  return null;
}

/* ----------------------------- Componente ----------------------------- */
export default function Proveedor() {
  const [apiUrl, setApiUrl] = useState(PRIMARY_API);

  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [formId, setFormId] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const isEdit = Boolean(formId);
  const formRef = useRef(null);

  // validaciones del formulario
  const [formErrors, setFormErrors] = useState({ nombre: "", correo: "", empresa: "", telefono: "" });
  const [touched, setTouched] = useState({ nombre: false, correo: false, empresa: false, telefono: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  /* --------- Reglas de validación (ajustables) --------- */
  const RULES = {
    nombre: { required: true, min: 2, max: 120 },
    correo: { required: true },
    empresa: { required: true, min: 2, max: 120 },
    telefono: { required: false, max: 30 }
  };

  function validateNombre(v) {
    const s = (v || "").trim();
    if (RULES.nombre.required && s.length === 0) return "Ingresa el nombre del proveedor";
    if (s.length < RULES.nombre.min) return `El nombre debe tener al menos ${RULES.nombre.min} caracteres`;
    if (s.length > RULES.nombre.max) return `El nombre no puede superar ${RULES.nombre.max} caracteres`;
    return "";
  }

  function validateCorreo(v) {
    const s = (v || "").trim();
    if (RULES.correo.required && s.length === 0) return "Ingresa el correo";
    // email básico
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (s.length > 0 && !re.test(String(s).toLowerCase())) return "Correo no tiene un formato válido";
    return "";
  }

  function validateEmpresa(v) {
    const s = (v || "").trim();
    if (RULES.empresa.required && s.length === 0) return "Ingresa el nombre de la empresa";
    if (s.length < RULES.empresa.min) return `La empresa debe tener al menos ${RULES.empresa.min} caracteres`;
    if (s.length > RULES.empresa.max) return `El nombre de la empresa no puede superar ${RULES.empresa.max} caracteres`;
    return "";
  }

  function validateTelefono(v) {
    const s = (v || "").trim();
    if (!s) return "";
    // permite números, espacios, +, -, paréntesis (básico)
    const re = /^[\d+\-\s()]{7,30}$/;
    if (!re.test(s)) return "Teléfono con formato inválido";
    if (s.length > RULES.telefono.max) return `El teléfono no puede superar ${RULES.telefono.max} caracteres`;
    return "";
  }

  function validateFormFields(values = {}) {
    return {
      nombre: validateNombre(values.nombre !== undefined ? values.nombre : nombre),
      correo: validateCorreo(values.correo !== undefined ? values.correo : correo),
      empresa: validateEmpresa(values.empresa !== undefined ? values.empresa : empresa),
      telefono: validateTelefono(values.telefono !== undefined ? values.telefono : telefono),
    };
  }

  /* --------- Autodetect API + Carga inicial --------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(PRIMARY_API);
        setApiUrl(PRIMARY_API);
        setProveedores(extractMany(res));
      } catch {
        try {
          const res2 = await axios.get(FALLBACK_API);
          setApiUrl(FALLBACK_API);
          setProveedores(extractMany(res2));
        } catch (errFallback) {
          console.error("Ambos endpoints fallaron:", errFallback);
          setError("No se pudo conectar a la API. Revisa backend y rutas.");
          setProveedores([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* --------- Recargar --------- */
  async function loadAll() {
    setLoading(true);
    setError("");
    // NO setMsg aquí para evitar mostrar el badge cada vez que recargas
    try {
      const res = await axios.get(apiUrl);
      const list = extractMany(res);
      setProveedores(list);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando proveedores");
    } finally {
      setLoading(false);
    }
  }

  /* --------- Crear / Editar --------- */
  function onNew() {
    setFormId("");
    setNombre("");
    setTelefono("");
    setCorreo("");
    setEmpresa("");
    setError("");
    setMsg("");
    setFormErrors({ nombre: "", correo: "", empresa: "", telefono: "" });
    setTouched({ nombre: false, correo: false, empresa: false, telefono: false });
    setOpenForm(true);
    setTimeout(() => {
      formRef.current?.querySelector("#provNombre")?.focus();
    }, 0);
  }

  async function onEdit(id) {
    setError("");
    // NO setMsg("Editando...") para evitar mostrar el badge cuando abres el modal
    try {
      const res = await axios.get(`${apiUrl}/${id}`);
      const item = extractOne(res);
      if (!item) {
        setError("No se pudo leer el proveedor desde la API.");
        return;
      }
      setFormId(item.idproveedor);
      setNombre(item.nombre || "");
      setTelefono(item.telefono || "");
      setCorreo(item.correo || "");
      setEmpresa(item.nombreempresa || "");
      setFormErrors({ nombre: "", correo: "", empresa: "", telefono: "" });
      setTouched({ nombre: false, correo: false, empresa: false, telefono: false });
      setOpenForm(true);
      setTimeout(() => {
        formRef.current?.querySelector("#provNombre")?.focus();
      }, 0);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    // sanitize
    const body = {
      nombre: (nombre || "").trim(),
      telefono: (telefono || "").trim(),
      correo: (correo || "").trim(),
      nombreempresa: (empresa || "").trim(),
    };

    // validar
    const errors = validateFormFields({
      nombre: body.nombre,
      correo: body.correo,
      empresa: body.nombreempresa,
      telefono: body.telefono,
    });
    setFormErrors(errors);
    setTouched({ nombre: true, correo: true, empresa: true, telefono: true });

    const hasError = Boolean(errors.nombre || errors.correo || errors.empresa || errors.telefono);
    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${apiUrl}/${formId}`, body);
        setMsg("Proveedor actualizado");
      } else {
        await axios.post(apiUrl, body);
        setMsg("Proveedor creado");
      }
      setOpenForm(false);
      await loadAll();
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.msg;
      setError(serverMsg || err.message);
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
      await axios.delete(`${apiUrl}/${deleteId}`);
      // NO setMsg("Proveedor eliminado") para evitar mostrar el badge cada vez que borras
      setOpenDelete(false);
      setDeleteId(null);
      await loadAll();
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.msg;
      setError(serverMsg || err.message);
    }
  }

  /* --------- Buscar --------- */
  async function handleSearch(e) {
    e && e.preventDefault && e.preventDefault();
    setError("");
    // NO setMsg("") here to avoid clearing/setting the badge frequently

    const q = (search || "").trim();
    if (!q) {
      await loadAll();
      return;
    }

    // ID numérico exacto
    if (/^\d+$/.test(q)) {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/${q}`);
        const one = extractOne(res);
        if (one) {
          setProveedores([one]);
        } else {
          setProveedores([]);
        }
      } catch {
        setProveedores([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Búsqueda local por texto
    try {
      const base =
        proveedores.length ? proveedores : extractMany(await axios.get(apiUrl));
      const s = q.toLowerCase();
      const filtered = base.filter((p) =>
        [p.nombre, p.correo, p.nombreempresa].join(" ").toLowerCase().includes(s)
      );
      setProveedores(filtered);
      setPage(1);
    } catch (err) {
      setError("Error buscando: " + (err?.response?.data?.message || err.message));
    }
  }

  /* --------- Filtro + paginación en UI --------- */
  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return proveedores.filter((p) =>
      [p.nombre, p.correo, p.nombreempresa].join(" ").toLowerCase().includes(s)
    );
  }, [proveedores, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // handlers para validación onBlur / onChange
  function handleNombreChange(v) {
    setNombre(v);
    if (touched.nombre) setFormErrors((p) => ({ ...p, nombre: validateNombre(v) }));
  }
  function handleCorreoChange(v) {
    setCorreo(v);
    if (touched.correo) setFormErrors((p) => ({ ...p, correo: validateCorreo(v) }));
  }
  function handleEmpresaChange(v) {
    setEmpresa(v);
    if (touched.empresa) setFormErrors((p) => ({ ...p, empresa: validateEmpresa(v) }));
  }
  function handleTelefonoChange(v) {
    setTelefono(v);
    if (touched.telefono) setFormErrors((p) => ({ ...p, telefono: validateTelefono(v) }));
  }
  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "nombre") setFormErrors((p) => ({ ...p, nombre: validateNombre(nombre) }));
    if (field === "correo") setFormErrors((p) => ({ ...p, correo: validateCorreo(correo) }));
    if (field === "empresa") setFormErrors((p) => ({ ...p, empresa: validateEmpresa(empresa) }));
    if (field === "telefono") setFormErrors((p) => ({ ...p, telefono: validateTelefono(telefono) }));
  }

  return (
    <div className="prov-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>Proveedores</h1>
          <div className="subtitle">Gestión y mantenimiento del catálogo</div>
        </div>

        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar proveedor">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por ID, nombre, correo o empresa…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(e); }}
            />
          </div>

          <button className="btn primary" onClick={handleSearch} disabled={loading}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar proveedor
          </button>
        </div>
      </header>

      {loading && <p style={{ padding: "12px 32px" }}>Cargando proveedores…</p>}
      {/* msg still used for create/update success messages */}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      {/* Tabla */}
      <div className="table-wrap">
        <table className="table" role="table" aria-label="Tabla de proveedores">
          <thead>
            <tr>
              <th scope="col" style={{ width: 120 }}>ID</th>
              <th scope="col">Nombre</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Correo</th>
              <th scope="col">Empresa</th>
              <th scope="col" style={{ width: 300 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageItems.map((p) => (
                <tr key={p.idproveedor}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{p.idproveedor}</td>
                  <td style={{ color: "#374151" }}>{p.nombre}</td>
                  <td style={{ color: "#374151" }}>{p.telefono || "-"}</td>
                  <td style={{ color: "#374151" }}>{p.correo || "-"}</td>
                  <td style={{ color: "#374151" }}>{p.nombreempresa || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => onEdit(p.idproveedor)}>
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(p.idproveedor)}>
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
                  {isEdit ? "Editar Proveedor" : "Registrar Proveedor"}
                </div>
                <div className="modal-sub">
                  {isEdit ? `Editando #${formId}` : "Crear nuevo proveedor"}
                </div>
              </div>
              <button className="close-x" aria-label="Cerrar" onClick={() => setOpenForm(false)}>
                &times;
              </button>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
              <div className="modal-body grid-2">
                <div className="form-row">
                  <label htmlFor="provNombre">Nombre *</label>
                  <input
                    id="provNombre"
                    type="text"
                    value={nombre}
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
                </div>

                <div className="form-row">
                  <label htmlFor="provTelefono">Teléfono</label>
                  <input
                    id="provTelefono"
                    type="text"
                    value={telefono}
                    onChange={(e) => handleTelefonoChange(e.target.value)}
                    onBlur={() => handleBlur("telefono")}
                    aria-invalid={Boolean(formErrors.telefono)}
                    maxLength={RULES.telefono.max}
                  />
                  {touched.telefono && formErrors.telefono ? (
                    <div className="field-error" role="alert" style={{ color: "var(--danger)", marginTop: 6 }}>{formErrors.telefono}</div>
                  ) : (
                    <div className="field-help" style={{ color: "#6b7280", marginTop: 6 }}>Formato: sólo números, espacios, +, - y ().</div>
                  )}
                </div>

                <div className="form-row">
                  <label htmlFor="provCorreo">Correo *</label>
                  <input
                    id="provCorreo"
                    type="email"
                    value={correo}
                    onChange={(e) => handleCorreoChange(e.target.value)}
                    onBlur={() => handleBlur("correo")}
                    required
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.correo)}
                  />
                  {touched.correo && formErrors.correo ? (
                    <div className="field-error" role="alert" style={{ color: "var(--danger)", marginTop: 6 }}>{formErrors.correo}</div>
                  ) : (
                    <div className="field-help" style={{ color: "#6b7280", marginTop: 6 }}>Ingresa un correo válido.</div>
                  )}
                </div>

                <div className="form-row">
                  <label htmlFor="provEmpresa">Empresa *</label>
                  <input
                    id="provEmpresa"
                    type="text"
                    value={empresa}
                    onChange={(e) => handleEmpresaChange(e.target.value)}
                    onBlur={() => handleBlur("empresa")}
                    required
                    aria-required="true"
                    aria-invalid={Boolean(formErrors.empresa)}
                    maxLength={RULES.empresa.max}
                  />
                  {touched.empresa && formErrors.empresa ? (
                    <div className="field-error" role="alert" style={{ color: "var(--danger)", marginTop: 6 }}>{formErrors.empresa}</div>
                  ) : (
                    <div className="field-help" style={{ color: "#6b7280", marginTop: 6 }}>{`Min ${RULES.empresa.min}, max ${RULES.empresa.max} caracteres.`}</div>
                  )}
                </div>

                {error ? <p className="note error" style={{ gridColumn: "1 / -1" }}>{error}</p> : null}
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
              <p>¿Eliminar el proveedor #{deleteId}?</p>
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
