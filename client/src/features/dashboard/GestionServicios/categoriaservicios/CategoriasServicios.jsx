// src/pages/CategoriasServicios.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./categoriaservicios.styles.css";

const API_URL = "http://localhost:3000/api/categoriaservicios";

/* ------------------- Normalizadores ------------------- */
function normalizeCategoria(raw) {
  if (!raw || typeof raw !== "object") return null;
  var id =
    raw.idcategoriaservicios != null ? raw.idcategoriaservicios :
    raw.idcategoria != null ? raw.idcategoria :
    raw.id != null ? raw.id :
    raw.categoria_id != null ? raw.categoria_id :
    raw.categoriaId != null ? raw.categoriaId :
    raw.Id != null ? raw.Id :
    null;

  var nombre =
    raw.nombrecategorias != null ? raw.nombrecategorias :
    raw.nombre != null ? raw.nombre :
    raw.name != null ? raw.name :
    raw.Nombre != null ? raw.Nombre :
    "";

  var descripcion =
    raw.descripcion != null ? raw.descripcion :
    raw.description != null ? raw.description :
    raw.Descripcion != null ? raw.Descripcion :
    "";

  if (id == null) return null;
  return { idcategoriaservicios: Number(id), nombrecategorias: String(nombre), descripcion: String(descripcion) };
}

function extractOneCategoria(res) {
  var d = res && res.data ? res.data : null;
  var candidates = [];
  if (d && typeof d === "object") {
    if (d.data != null) candidates.push(d.data);
    if (d.item != null) candidates.push(d.item);
  }
  if (d) candidates.push(d);
  if (d && d.rows && Array.isArray(d.rows) && d.rows.length > 0) candidates.push(d.rows[0]);
  if (Array.isArray(d) && d.length > 0) candidates.push(d[0]);

  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (Array.isArray(c)) {
      for (var j = 0; j < c.length; j++) {
        var n = normalizeCategoria(c[j]);
        if (n) return n;
      }
    } else {
      var n2 = normalizeCategoria(c);
      if (n2) return n2;
    }
  }
  return null;
}

function extractManyCategorias(res) {
  var d = res && res.data ? res.data : null;
  var arr = null;

  if (d && d.data && Array.isArray(d.data)) arr = d.data;
  else if (d && d.rows && Array.isArray(d.rows)) arr = d.rows;
  else if (d && d.items && Array.isArray(d.items)) arr = d.items;
  else if (d && d.categorias && Array.isArray(d.categorias)) arr = d.categorias;
  else if (Array.isArray(d)) arr = d;

  if (!arr) return [];
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var n = normalizeCategoria(arr[i]);
    if (n) {
      var exists = out.some((c) => c.idcategoriaservicios === n.idcategoriaservicios);
      if (!exists) out.push(n);
    }
  }
  return out;
}

/* -------------------------------- Componente -------------------------------- */
export default function CategoriasServicios() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [idcategoriaservicios, setIdCategoria] = useState("");
  const [nombrecategorias, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const isEdit = useMemo(() => Boolean(idcategoriaservicios), [idcategoriaservicios]);

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  async function loadCategorias(q) {
    if (q === undefined) q = "";
    setLoading(true);
    setError("");
    setMsg("");
    try {
      var url = q ? (API_URL + "?search=" + encodeURIComponent(q)) : API_URL;
      var res = await axios.get(url);
      var list = extractManyCategorias(res);
      setCategorias(list);
      setMsg("Resultados: " + list.length);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando categorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategorias(); }, []);

  function resetForm() {
    setIdCategoria("");
    setNombre("");
    setDescripcion("");
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  async function onEdit(id) {
    setError("");
    setMsg("");
    try {
      var res = await axios.get(API_URL + "/" + id);
      var c = extractOneCategoria(res);
      if (!c) {
        setError("No se pudo leer la categoría desde la API (estructura inesperada).");
        return;
      }
      setIdCategoria(c.idcategoriaservicios);
      setNombre(c.nombrecategorias || "");
      setDescripcion(c.descripcion || "");
      setOpenForm(true);
      setMsg("Editando categoría #" + c.idcategoriaservicios);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    setError("");
    try {
      await axios.delete(API_URL + "/" + deleteId);
      setMsg("Categoría eliminada");
      setOpenDelete(false);
      setDeleteId(null);
      await loadCategorias(search);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    var nombre = (nombrecategorias || "").trim();
    if (!nombre) {
      setError("Ingresa el nombre de la categoría");
      return;
    }
    try {
      if (isEdit) {
        await axios.put(API_URL + "/" + idcategoriaservicios, { nombrecategorias: nombre, descripcion });
        setMsg("Categoría actualizada");
      } else {
        await axios.post(API_URL, { nombrecategorias: nombre, descripcion });
        setMsg("Categoría creada");
      }
      setOpenForm(false);
      resetForm();
      await loadCategorias(search);
    } catch (err2) {
      setError(err2?.response?.data?.msg || err2.message);
    }
  }

  const filtered = useMemo(() => {
    var s = (search || "").trim().toLowerCase();
    return categorias.filter((c) => {
      return (
        (c.nombrecategorias || "").toLowerCase().includes(s) ||
        (c.descripcion || "").toLowerCase().includes(s)
      );
    });
  }, [categorias, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  return (
    <div className="categorias-page">
      <header className="header">
        <div className="header-left">
          <h1>Categorías de Servicios</h1>
        </div>
        <div className="header-actions">
          <div className="search-wrapper" role="search">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre o descripción…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") loadCategorias(search); }}
            />
          </div>

          <button className="btn primary" onClick={() => loadCategorias(search)}>
            <span className="material-symbols-rounded">refresh</span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span>
            Registrar nueva categoría
          </button>
        </div>
      </header>

      {loading && <p style={{ padding: "12px 32px" }}>Cargando categorías…</p>}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      <div className="tables-container">
        <table role="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!loading && pageItems.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageItems.map((c) => (
                <tr key={c.idcategoriaservicios}>
                  <td style={{ fontWeight: 700 }}>{c.idcategoriaservicios}</td>
                  <td>{c.nombrecategorias}</td>
                  <td>{c.descripcion}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => onEdit(c.idcategoriaservicios)}>
                        <span className="material-symbols-rounded">edit</span> Editar
                      </button>
                      <button className="btn-delete" onClick={() => askDelete(c.idcategoriaservicios)}>
                        <span className="material-symbols-rounded">delete</span> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filtered.length > pageSize && (
          <div className="pagination-container">
            <div className="pagination-bar">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>◀</button>
              <div style={{ display: "flex", gap: 8 }}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  var n = i + 1;
                  var within = (n >= page - 2 && n <= page + 2);
                  var show = (n === 1 || n === totalPages || within);
                  if (!show) return null;
                  return (
                    <button key={n} className={"page-btn " + (page === n ? "active" : "")} onClick={() => setPage(n)}>{n}</button>
                  );
                })}
              </div>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}>▶</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {openForm && (
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setOpenForm(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">{isEdit ? "Editar Categoría" : "Registrar Nueva Categoría"}</div>
                <div className="modal-sub">{isEdit ? ("Editando #" + idcategoriaservicios) : "Crear nueva categoría de servicio"}</div>
              </div>
              <button className="close-btn" onClick={() => setOpenForm(false)}>&times;</button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Nombre</label>
                  <input type="text" value={nombrecategorias} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div className="form-row">
                  <label>Descripción</label>
                  <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}></textarea>
                </div>
                {error ? <p className="note error">{error}</p> : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)}>Cancelar</button>
                <button type="submit" className="btn primary">
                  <span className="material-symbols-rounded">check</span>
                  {isEdit ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {openDelete && (
        <div className="modal modal-delete show" onClick={(e) => { if (e.target.classList.contains("modal")) setOpenDelete(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button className="close-btn" onClick={() => setOpenDelete(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 16 }}>Vas a eliminar la categoría:</p>
              <p style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)" }}>#{deleteId}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenDelete(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
