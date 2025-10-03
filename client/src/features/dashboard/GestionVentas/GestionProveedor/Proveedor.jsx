import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./proveedor.styles.css";

const PRIMARY_API = "http://localhost:3000/api/proveedores";
const FALLBACK_API = "http://localhost:3000/proveedores";

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

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

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
    setMsg("");
    try {
      const res = await axios.get(apiUrl);
      const list = extractMany(res);
      setProveedores(list);
      setMsg("Resultados: " + list.length);
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
    setOpenForm(true);
    setTimeout(() => {
      formRef.current?.querySelector("#provNombre")?.focus();
    }, 0);
  }

  async function onEdit(id) {
    setError("");
    setMsg("");
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
      setOpenForm(true);
      setMsg("Editando proveedor #" + item.idproveedor);
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

    const body = {
      nombre: (nombre || "").trim(),
      telefono: (telefono || "").trim(),
      correo: (correo || "").trim(),
      nombreempresa: (empresa || "").trim(),
    };

    if (!body.nombre || !body.correo || !body.nombreempresa) {
      setError("Completa: Nombre, Correo y Empresa.");
      return;
    }

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
      setMsg("Proveedor eliminado");
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
    setMsg("");

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
          setMsg("Resultado por ID");
        } else {
          setProveedores([]);
          setMsg("No encontrado");
        }
      } catch {
        setProveedores([]);
        setMsg("No encontrado");
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
      setMsg(`Resultados: ${filtered.length}`);
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

          <button className="btn primary" onClick={handleSearch}>
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

            <form ref={formRef} onSubmit={onSubmit}>
              <div className="modal-body grid-2">
                <div className="form-row">
                  <label htmlFor="provNombre">Nombre *</label>
                  <input
                    id="provNombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); formRef.current?.requestSubmit(); } }}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="provTelefono">Teléfono</label>
                  <input
                    id="provTelefono"
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="provCorreo">Correo *</label>
                  <input
                    id="provCorreo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="provEmpresa">Empresa *</label>
                  <input
                    id="provEmpresa"
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    required
                  />
                </div>

                {error ? <p className="note error" style={{ gridColumn: "1 / -1" }}>{error}</p> : null}
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
