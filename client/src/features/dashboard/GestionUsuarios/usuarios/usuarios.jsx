// features/dashboard/GestionUsuarios/usuarios/Usuarios.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./usuarios.styles.css";

const API_USERS = "http://localhost:3000/api/usuarios";
const API_ROLES  = "http://localhost:3000/api/roles";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null); // cedula cuando edita
  const [form, setForm] = useState({
    cedula: "",
    nombre: "",
    telefono: "",
    email: "",
    contrasena: "",
    idroles: "",
  });

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // cedula

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ------- Data loading -------
  async function fetchUsuarios() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(API_USERS, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.ok) {
        setUsuarios(data.data || []);
        setMsg(`Usuarios cargados: ${(data.data || []).length}`);
      } else {
        setError(data?.msg || "Error obteniendo usuarios");
      }
    } catch (err) {
      setError(err.message || "Error obteniendo usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch(API_ROLES, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.ok) {
        setRoles(data.data || []);
      } else {
        console.warn("fetchRoles:", data);
      }
    } catch (err) {
      console.error("fetchRoles error:", err);
    }
  }

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- Helpers -------
  function resetForm() {
    setForm({
      cedula: "",
      nombre: "",
      telefono: "",
      email: "",
      contrasena: "",
      idroles: "",
    });
    setEditId(null);
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onEdit(user) {
    setForm({
      cedula: user.cedula,
      nombre: user.nombre,
      telefono: user.telefono,
      email: user.email,
      contrasena: "", // opcional al editar
      idroles: String(user.idroles || user.roles?.idroles || ""),
    });
    setEditId(user.cedula);
    setOpenForm(true);
    setMsg(`Editando usuario #${user.cedula}`);
  }

  function askDelete(cedula) {
    setDeleteId(cedula);
    setOpenDelete(true);
  }

  // ------- CRUD -------
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    // Validaciones mínimas
    if (!form.nombre || !form.email || !form.telefono || !form.idroles) {
      setError("Completa los campos obligatorios.");
      return;
    }
    if (!editId && !form.cedula) {
      setError("La cédula es obligatoria al crear.");
      return;
    }
    if (!editId && !form.contrasena) {
      setError("La contraseña es obligatoria al crear.");
      return;
    }

    const url = editId ? `${API_USERS}/${editId}` : API_USERS;
    const method = editId ? "PUT" : "POST";
    const body = {
      ...form,
      idroles: Number(form.idroles),
    };
    if (editId && (!body.contrasena || body.contrasena.trim() === "")) {
      delete body.contrasena; // no actualizar contraseña si está vacía
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError((data && data.msg) || `Error ${res.status} al guardar usuario`);
        return;
      }

      setMsg(editId ? "Usuario actualizado" : "Usuario creado");
      setOpenForm(false);
      resetForm();
      await fetchUsuarios();
    } catch (err) {
      setError(err.message || "Error en la petición");
    }
  }

  async function confirmDelete() {
    setError("");
    setMsg("");
    try {
      const res = await fetch(`${API_USERS}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) {
        setMsg("Usuario eliminado");
        setOpenDelete(false);
        setDeleteId(null);
        await fetchUsuarios();
      } else {
        setError(data?.msg || "Error al eliminar usuario");
      }
    } catch (err) {
      setError(err.message || "Error al eliminar usuario");
    }
  }

  // ------- Search + pagination -------
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const rolTxt = u.roles?.descripcion || String(u.idroles || "");
      return (
        String(u.cedula).toLowerCase().includes(q) ||
        String(u.nombre).toLowerCase().includes(q) ||
        String(u.email).toLowerCase().includes(q) ||
        String(u.telefono).toLowerCase().includes(q) ||
        String(rolTxt).toLowerCase().includes(q)
      );
    });
  }, [usuarios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="usuarios-module">
      {/* Header */}
      <header className="usuarios-header">
        <div>
          <h1 className="usuarios-title">Usuarios</h1>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
            Administra creación, edición y eliminación de usuarios
          </div>
        </div>

        <div className="usuarios-actions">
          <div className="search-wrap" role="search" aria-label="Buscar usuarios">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">
              search
            </span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por cédula, nombre, correo o rol…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPage(1);
              }}
            />
          </div>

          <button className="btn" onClick={() => fetchUsuarios()}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Nuevo Usuario
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="usuarios-table-wrap">
        {loading && <p style={{ padding: "12px 32px" }}>Cargando usuarios…</p>}
        {!loading && msg ? <p style={{ padding: "0 32px", color: "#374151" }}>{msg}</p> : null}
        {error ? <p style={{ padding: "0 32px", color: "#be1e2d", fontWeight: 600 }}>{error}</p> : null}

        {/* Tabla */}
        <table className="usuarios-table" role="table" aria-label="Tabla de usuarios">
          <thead>
            <tr>
              <th scope="col">Cédula</th>
              <th scope="col">Nombre</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Correo</th>
              <th scope="col">Rol</th>
              <th scope="col">Acciones</th>
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
              pageItems.map((u) => (
                <tr key={u.cedula}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{u.cedula}</td>
                  <td style={{ color: "#374151" }}>{u.nombre}</td>
                  <td style={{ color: "#374151" }}>{u.telefono}</td>
                  <td style={{ color: "#374151" }}>{u.email}</td>
                  <td style={{ color: "#374151" }}>
                    {u.roles?.descripcion || u.idroles}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => onEdit(u)} title="Editar">
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(u.cedula)} title="Eliminar">
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
                <div className="modal-title" id="modalTitle">{editId ? "Editar Usuario" : "Registrar Usuario"}</div>
                <div className="modal-sub">
                  {editId ? `Editando #${editId}` : "Completa los campos para crear un usuario"}
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
              <div className="modal-body">
                {/* Columna izquierda */}
                <div className="form-col">
                  {!editId && (
                    <>
                      <label htmlFor="uCedula">Cédula</label>
                      <input
                        id="uCedula"
                        type="text"
                        name="cedula"
                        placeholder="Cédula"
                        value={form.cedula}
                        onChange={handleChange}
                        required
                        autoFocus
                      />
                    </>
                  )}

                  <label htmlFor="uNombre">Nombre</label>
                  <input
                    id="uNombre"
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="uTelefono">Teléfono</label>
                  <input
                    id="uTelefono"
                    type="text"
                    name="telefono"
                    placeholder="Teléfono"
                    value={form.telefono}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Columna derecha */}
                <div className="form-col">
                  <label htmlFor="uEmail">Correo</label>
                  <input
                    id="uEmail"
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />

                  {!editId ? (
                    <>
                      <label htmlFor="uPass">Contraseña</label>
                      <input
                        id="uPass"
                        type="password"
                        name="contrasena"
                        placeholder="Contraseña"
                        value={form.contrasena}
                        onChange={handleChange}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="uNewPass">Nueva contraseña (opcional)</label>
                      <input
                        id="uNewPass"
                        type="password"
                        name="contrasena"
                        placeholder="Nueva contraseña (opcional)"
                        value={form.contrasena}
                        onChange={handleChange}
                      />
                    </>
                  )}

                  <label htmlFor="uRol">Rol</label>
                  <select
                    id="uRol"
                    name="idroles"
                    value={form.idroles}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.idroles} value={rol.idroles}>
                        {rol.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                {error ? (
                  <div style={{ gridColumn: "1 / -1", color: "#be1e2d", fontWeight: 600 }}>
                    {error}
                  </div>
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
              <div style={{ fontSize: 16, color: "#111827" }}>
                Vas a eliminar el usuario:
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#be1e2d" }}>
                {deleteId}
              </div>
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
