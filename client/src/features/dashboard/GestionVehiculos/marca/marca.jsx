import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./marcas.styles.css";

const API_URL = "http://localhost:3000/api/marcas";

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null); // idmarca cuando edita
  const [descripcion, setDescripcion] = useState("");

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function fetchMarcas() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await axios.get(API_URL);
      const list = (res?.data?.data || []).map((m) => ({
        idmarca: Number(m.idmarca),
        descripcion: String(m.descripcion || ""),
      }));
      setMarcas(list);
      setMsg("Marcas cargadas: " + list.length);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error obteniendo marcas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMarcas();
  }, []);

  function resetForm() {
    setEditId(null);
    setDescripcion("");
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  function onEdit(marca) {
    setEditId(marca.idmarca);
    setDescripcion(marca.descripcion || "");
    setOpenForm(true);
    setMsg("Editando marca #" + marca.idmarca);
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    const desc = (descripcion || "").trim();

    if (!desc) {
      setError("⚠️ Ingresa la descripción");
      return;
    }

    // Validación: no números, solo letras y espacios
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!regex.test(desc)) {
      setError("⚠️ La descripción solo debe contener letras y espacios");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, { descripcion: desc });
        setMsg("✅ Marca actualizada");
      } else {
        await axios.post(API_URL, { descripcion: desc });
        setMsg("✅ Marca creada");
      }
      setOpenForm(false);
      resetForm();
      await fetchMarcas();
    } catch (err) {
      setError("❌ " + (err?.response?.data?.msg || err.message || "Error guardando marca"));
    }
  }


  async function confirmDelete() {
    setError("");
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setMsg("Marca eliminada");
      setOpenDelete(false);
      setDeleteId(null);
      await fetchMarcas();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error eliminando marca");
    }
  }

  // búsqueda y paginación (cliente)
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return marcas;
    return marcas.filter((m) => String(m.descripcion).toLowerCase().includes(q));
  }, [marcas, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="marcas-page">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">Marcas</h1>
          <div className="subtitle">Administra las marcas de vehículos</div>
        </div>

        <div className="actions">
          <div className="search-wrapper" role="search" aria-label="Buscar marcas">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por descripción…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
            />
          </div>

          <button className="btn" onClick={() => fetchMarcas()}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Nueva Marca
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando marcas…</p>}
        {!loading && msg ? <p className="note">{msg}</p> : null}
        {error ? <p className="note error">{error}</p> : null}

        {/* Tabla */}
        <table className="table" role="table" aria-label="Tabla de marcas">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Descripción</th>
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
              pageItems.map((m) => (
                <tr key={m.idmarca}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{m.idmarca}</td>
                  <td style={{ color: "#374151" }}>{m.descripcion}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => onEdit(m)} title="Editar">
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(m.idmarca)} title="Eliminar">
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
                <div className="modal-title" id="modalTitle">{editId ? "Editar Marca" : "Registrar Marca"}</div>
                <div className="modal-sub">
                  {editId ? `Editando #${editId}` : "Completa la descripción para crear una marca"}
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
                <label htmlFor="mDesc">Descripción</label>
                <input
                  id="mDesc"
                  type="text"
                  placeholder="Ej: Toyota"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
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
              <div style={{ fontSize: 16, color: "#111827" }}>Vas a eliminar la marca:</div>
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
