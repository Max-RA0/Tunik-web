import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./servicios.styles.css";

const API_SVC = "http://localhost:3000/api/servicios";
const API_CAT = "http://localhost:3000/api/categorias";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nombreservicios: "",
    idcategoriaservicios: "",
    preciounitario: "",
  });

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ---------------------- Fetch helpers ---------------------- */
  async function fetchServicios() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(API_SVC, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) {
        setServicios(Array.isArray(data.data) ? data.data : []);
        setMsg(`Resultados: ${Array.isArray(data.data) ? data.data.length : 0}`);
      } else {
        setServicios([]);
        setMsg("Resultados: 0");
      }
    } catch (err) {
      setError(err.message || "Error cargando servicios");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategorias() {
    try {
      const res = await fetch(API_CAT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) setCategorias(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      // no rompemos UI si falla el listado de categorías
      console.error(err);
    }
  }

  useEffect(() => {
    fetchServicios();
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------- CRUD handlers ---------------------- */
  function onNew() {
    setEditId(null);
    setForm({ nombreservicios: "", idcategoriaservicios: "", preciounitario: "" });
    setError("");
    setMsg("");
    setOpenForm(true);
  }

  async function onEdit(id) {
    setError("");
    setMsg("");
    try {
      const res = await fetch(`${API_SVC}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const s = data?.data || data; // tolerante
      if (!s) {
        setError("No se pudo leer el servicio desde la API.");
        return;
      }
      setEditId(s.idservicios);
      setForm({
        nombreservicios: s.nombreservicios ?? "",
        idcategoriaservicios: s.idcategoriaservicios ?? "",
        preciounitario: s.preciounitario ?? "",
      });
      setOpenForm(true);
      setMsg(`Editando servicio #${s.idservicios}`);
    } catch (err) {
      setError(err.message || "Error leyendo servicio");
    }
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    setError("");
    try {
      const res = await fetch(`${API_SVC}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) {
        setMsg("Servicio eliminado");
        setOpenDelete(false);
        setDeleteId(null);
        await fetchServicios();
      } else {
        setError(data?.msg || "No se pudo eliminar");
      }
    } catch (err) {
      setError(err.message || "Error eliminando");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Validaciones mínimas
    const payload = {
      nombreservicios: (form.nombreservicios || "").trim(),
      idcategoriaservicios: Number(form.idcategoriaservicios),
      preciounitario: Number(form.preciounitario),
    };
    if (!payload.nombreservicios) return setError("Ingresa el nombre");
    if (!payload.idcategoriaservicios) return setError("Selecciona una categoría");
    if (!(payload.preciounitario > 0)) return setError("Ingresa un precio válido");

    try {
      const url = editId ? `${API_SVC}/${editId}` : API_SVC;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.ok) {
        setMsg(editId ? "Servicio actualizado" : "Servicio creado");
        setOpenForm(false);
        setEditId(null);
        setForm({ nombreservicios: "", idcategoriaservicios: "", preciounitario: "" });
        await fetchServicios();
      } else {
        setError(data?.msg || "Error al guardar");
      }
    } catch (err) {
      setError(err.message || "Error al guardar");
    }
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ---------------------- Búsqueda + paginación ---------------------- */
  const filtered = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    if (!s) return servicios;
    return servicios.filter((x) => {
      const nom = String(x.nombreservicios ?? "").toLowerCase();
      const precio = String(x.preciounitario ?? "").toLowerCase();
      const cat = String(x.categoriaservicios?.nombrecategorias ?? x.idcategoriaservicios ?? "").toLowerCase();
      return nom.includes(s) || precio.includes(s) || cat.includes(s);
    });
  }, [servicios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  /* ---------------------- UI ---------------------- */
  return (
    <div className="roles-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>Servicios</h1>
        </div>
        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar servicio">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre, categoría o precio…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
            />
          </div>

          <button className="btn primary" onClick={() => fetchServicios()}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Recargar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar servicio
          </button>
        </div>
      </header>

      {/* Alerts */}
      {loading && <p style={{ padding: "12px 32px" }}>Cargando servicios…</p>}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      {/* Tabla + paginación */}
      <div className="tables-container">
        <table role="table" aria-label="Tabla de servicios">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Nombre</th>
              <th scope="col">Categoría</th>
              <th scope="col">Precio</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageItems.map((s) => (
                <tr key={s.idservicios}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{s.idservicios}</td>
                  <td style={{ color: "#374151" }}>{s.nombreservicios}</td>
                  <td style={{ color: "#374151" }}>
                    {s.categoriaservicios?.nombrecategorias ?? s.idcategoriaservicios}
                  </td>
                  <td style={{ color: "#374151" }}>{s.preciounitario}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => onEdit(s.idservicios)} title="Editar">
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => askDelete(s.idservicios)} title="Eliminar">
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
                <div className="modal-title" id="modalTitle">{editId ? "Editar Servicio" : "Registrar Servicio"}</div>
                <div className="modal-sub">
                  {editId ? `Editando #${editId}` : "Crear un nuevo servicio"}
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="Cerrar"
                onClick={() => setOpenForm(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label htmlFor="nombreservicios">Nombre del servicio</label>
                  <input
                    id="nombreservicios"
                    name="nombreservicios"
                    type="text"
                    placeholder="Ej: Cambio de Aceite"
                    value={form.nombreservicios}
                    onChange={onFormChange}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="idcategoriaservicios">Categoría</label>
                  <select
                    id="idcategoriaservicios"
                    name="idcategoriaservicios"
                    value={form.idcategoriaservicios}
                    onChange={onFormChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((c) => (
                      <option key={c.idcategoriaservicios} value={c.idcategoriaservicios}>
                        {c.nombrecategorias ?? c.nombre ?? `Cat #${c.idcategoriaservicios}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label htmlFor="preciounitario">Precio unitario</label>
                  <input
                    id="preciounitario"
                    name="preciounitario"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 80000"
                    value={form.preciounitario}
                    onChange={onFormChange}
                    required
                  />
                </div>

                {error ? <p className="note error" style={{ marginTop: 6 }}>{error}</p> : null}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setOpenForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  onClick={(e) => e.currentTarget.form?.requestSubmit()}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">check</span>
                  {editId ? "Actualizar" : "Guardar"}
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
              <button
                type="button"
                className="close-btn"
                aria-label="Cerrar"
                onClick={() => setOpenDelete(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 16, color: "#111827", marginBottom: 8 }}>
                Vas a eliminar el servicio:
              </p>
              <p style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)", marginBottom: 12 }}>
                #{deleteId}
              </p>
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Confirma que deseas eliminar este registro permanentemente.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenDelete(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
