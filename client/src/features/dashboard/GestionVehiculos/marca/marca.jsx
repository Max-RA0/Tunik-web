// features/dashboard/GestionServicios/marcas/Marcas.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./marcas.styles.css";

const API_URL = "https://tunik-api.onrender.com/api/marcas";

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [alerta, setAlerta] = useState("");
  const [search, setSearch] = useState("");

  // Modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [descripcion, setdescripcion] = useState("");

  // Modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function fetchMarcas() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await axios.get(API_URL);
      const raw = res?.data.data;
      const arr = Array.isArray(raw) ? raw : (raw?.data || []);
      const list = arr.map((m) => ({
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
    setdescripcion("");
    setError("");
    setMsg("");
    setAlerta("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  function onEdit(marca) {
    setEditId(marca.idmarca);
    setdescripcion(marca.descripcion || "");
    setOpenForm(true);
    setMsg("Editando marca #" + marca.idmarca);
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  // ✅ Validación: solo letras
  const handledescripcionChange = (e) => {
    const valor = e.target.value;
    if (/\d/.test(valor)) {
      setAlerta("El descripcion no puede contener números");
      return;
    } else {
      setAlerta("");
    }
    setdescripcion(valor);
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setAlerta("");
    const nom = (descripcion || "").trim();

    // Validar campo vacío
    if (!nom) {
      setAlerta("El descripcion es obligatorio");
      return;
    }

    // Validar duplicado (sin distinguir mayúsculas/minúsculas)
    const descripcionExiste = marcas.some(
      (m) =>
        m.descripcion.toLowerCase() === nom.toLowerCase() &&
        m.idmarca !== editId
    );
    if (descripcionExiste) {
      setAlerta("Ya existe una marca con ese descripcion");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, { descripcion: nom });
        setMsg("Marca actualizada correctamente");
      } else {
        await axios.post(API_URL, { descripcion: nom });
        setMsg("Marca creada correctamente");
      }
      setOpenForm(false);
      resetForm();
      await fetchMarcas();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error guardando marca");
    }
  }

  async function confirmDelete() {
    setError("");
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setMsg("Marca eliminada correctamente");
      setOpenDelete(false);
      setDeleteId(null);
      await fetchMarcas();
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error eliminando marca");
    }
  }

  // Búsqueda + paginación
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
      <header className="header">
        <div>
          <h1 className="title">Marcas</h1>
          <div className="subtitle">Administra las marcas registradas</div>
        </div>

        <div className="actions">
          <div className="search-wrapper" role="search" aria-label="Buscar marcas">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por descripcion…"
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

      <div className="table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando marcas…</p>}
        {!loading && msg ? <p className="note">{msg}</p> : null}
        {error ? <p className="note error">{error}</p> : null}

        <table className="table" role="table" aria-label="Tabla de marcas">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">descripcion</th>
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
      </div>

      {/* MODAL CREAR/EDITAR */}
      {openForm ? (
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setOpenForm(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editId ? "Editar Marca" : "Registrar Marca"}</div>
                <div className="modal-sub">
                  {editId ? `Editando #${editId}` : "Completa el descripcion para crear una marca"}
                </div>
              </div>
              <button type="button" className="close-x" aria-label="Cerrar" onClick={() => setOpenForm(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body" style={{ gridTemplateColumns: "1fr" }}>
                <label htmlFor="marcadescripcion">descripcion</label>
                <input
                  id="marcadescripcion"
                  type="text"
                  placeholder="Ej: Toyota, Ford, Honda…"
                  value={descripcion}
                  onChange={handledescripcionChange}
                  autoFocus
                  required
                />
                {alerta && (
                  <div
                    className="alerta"
                    style={{
                      background: "#fdecea",
                      color: "#be1e2d",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      marginTop: "6px",
                    }}
                  >
                    {alerta}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setOpenForm(false)}>Cancelar</button>
                <button type="submit" className="btn dark">
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
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setOpenDelete(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button type="button" className="close-x" aria-label="Cerrar" onClick={() => setOpenDelete(false)}>
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
              <button className="btn" onClick={() => setOpenDelete(false)}>Cancelar</button>
              <button className="btn dark" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
