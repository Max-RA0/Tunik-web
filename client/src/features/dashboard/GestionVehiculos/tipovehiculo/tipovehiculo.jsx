import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./tipovehiculos.styles.css";

const API_URL = "http://localhost:3000/api/tipovehiculos";

export default function TipoVehiculos() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null); // idtipovehiculos cuando edita
  const [nombre, setNombre] = useState("");

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function fetchTipos() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await axios.get(API_URL);
      const raw = res?.data;
      const arr = Array.isArray(raw) ? raw : (raw?.data || []);
      const list = arr.map((t) => ({
        idtipovehiculos: Number(t.idtipovehiculos),
        nombre: String(t.nombre || ""),
      }));
      setTipos(list);
      setMsg("Tipos cargados: " + list.length);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error obteniendo tipos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTipos();
  }, []);

  function resetForm() {
    setEditId(null);
    setNombre("");
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  function onEdit(tipo) {
    setEditId(tipo.idtipovehiculos);
    setNombre(tipo.nombre || "");
    setOpenForm(true);
    setMsg("Editando tipo #" + tipo.idtipovehiculos);
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const nom = (nombre || "").trim();
    if (!nom) {
      setError("Ingresa el nombre");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, { nombre: nom });
        setMsg("Tipo actualizado");
      } else {
        await axios.post(API_URL, { nombre: nom });
        setMsg("Tipo creado");
      }
      setOpenForm(false);
      resetForm();
      await fetchTipos();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error guardando tipo");
    }
  }

  async function confirmDelete() {
    setError("");
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setMsg("Tipo eliminado");
      setOpenDelete(false);
      setDeleteId(null);
      await fetchTipos();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error eliminando tipo");
    }
  }

  // búsqueda y paginación (cliente)
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return tipos;
    return tipos.filter((t) => String(t.nombre).toLowerCase().includes(q));
  }, [tipos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="tipos-page">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">Tipos de Vehículos</h1>
          <div className="subtitle">Administra los tipos disponibles</div>
        </div>

        <div className="actions">
          <div className="search-wrapper" role="search" aria-label="Buscar tipos">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
            />
          </div>

          <button className="btn" onClick={() => fetchTipos()}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Nuevo Tipo
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando tipos…</p>}
        {!loading && msg ? <p className="note">{msg}</p> : null}
        {error ? <p className="note error">{error}</p> : null}

        {/* Tabla */}
        <table className="table" role="table" aria-label="Tabla de tipos de vehículos">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Nombre</th>
              <th scope="col">Acciones</th>
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
              pageItems.map((t) => (
                <tr key={t.idtipovehiculos}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{t.idtipovehiculos}</td>
                  <td style={{ color: "#374151" }}>{t.nombre}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => onEdit(t)} title="Editar">
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(t.idtipovehiculos)} title="Eliminar">
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
          <div className="pagination" role="navigation" aria-label="Paginación">
            <button
              className="page-btn"
              aria-label="Anterior"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ◀
            </button>

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

            <button
              className="page-btn"
              aria-label="Siguiente"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ▶
            </button>
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
                <div className="modal-title" id="modalTitle">{editId ? "Editar Tipo" : "Registrar Tipo"}</div>
                <div className="modal-sub">
                  {editId ? `Editando #${editId}` : "Completa el nombre para crear un tipo"}
                </div>
              </div>
              <button
                type="button"
                className="close-x"
                aria-label="Cerrar"
                onClick={() => setOpenForm(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body" style={{ gridTemplateColumns: "1fr" }}>
                <label htmlFor="tvNombre">Nombre</label>
                <input
                  id="tvNombre"
                  type="text"
                  placeholder="Ej: Carro, Moto, Camioneta…"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                  required
                />

                {error ? (
                  <div style={{ color: "#be1e2d", fontWeight: 600 }}>{error}</div>
                ) : null}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setOpenForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn dark"
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
              <button
                type="button"
                className="close-x"
                aria-label="Cerrar"
                onClick={() => setOpenDelete(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ gridTemplateColumns: "1fr" }}>
              <div style={{ fontSize: 16, color: "#111827" }}>Vas a eliminar el tipo:</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#be1e2d" }}>#{deleteId}</div>
              <div style={{ color: "#6b7280" }}>
                Confirma que deseas eliminar este registro permanentemente.
              </div>
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
      ) : null}
    </div>
  );
}
