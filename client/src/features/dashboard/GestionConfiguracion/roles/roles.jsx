import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./roles.styles.css";

const API_URL = "http://localhost:3000/api/roles";

/* ------------------- Sets quemados ------------------- */
const PERMISOS_LIST = [
  { key: "usuarios", label: "Gestión de Usuarios" },
  { key: "servicios", label: "Gestión de Servicios" },
  { key: "ventas", label: "Gestión de Ventas" },
  { key: "evaluacion", label: "Evaluación Servicios" },
  { key: "vehiculos", label: "Vehículos" },
  { key: "configuracion", label: "Configuración" },
];

const PRIVILEGIOS_LIST = [
  { key: "crear", label: "Registrar" },
  { key: "buscar", label: "Buscar" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
];

/* ------------------- Normalizadores (tolera formas distintas) ------------------- */
function normalizeRole(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw.idroles ?? raw.idrol ?? raw.id ?? raw.role_id ?? raw.roleId ?? raw.Id ?? raw.IdRol ?? null;

  const desc =
    raw.descripcion ??
    raw.description ??
    raw.nombre ??
    raw.name ??
    raw.Descripcion ??
    raw.Nombre ??
    "";

  if (id == null) return null;
  return { idroles: Number(id), descripcion: String(desc) };
}

function extractOneRole(res) {
  const d = res?.data ?? null;
  const candidates = [];
  if (d && typeof d === "object") {
    if (d.data != null) candidates.push(d.data);
    if (d.role != null) candidates.push(d.role);
    if (d.item != null) candidates.push(d.item);
  }
  if (d) candidates.push(d);
  if (d?.rows && Array.isArray(d.rows) && d.rows.length > 0) candidates.push(d.rows[0]);
  if (Array.isArray(d) && d.length > 0) candidates.push(d[0]);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (Array.isArray(c)) {
      for (let j = 0; j < c.length; j++) {
        const n = normalizeRole(c[j]);
        if (n) return n;
      }
    } else {
      const n2 = normalizeRole(c);
      if (n2) return n2;
    }
  }
  return null;
}

function extractManyRoles(res) {
  const d = res?.data ?? null;
  let arr = null;

  if (d?.data && Array.isArray(d.data)) arr = d.data;
  else if (d?.rows && Array.isArray(d.rows)) arr = d.rows;
  else if (d?.items && Array.isArray(d.items)) arr = d.items;
  else if (d?.roles && Array.isArray(d.roles)) arr = d.roles;
  else if (Array.isArray(d)) arr = d;

  if (!arr) return [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const n = normalizeRole(arr[i]);
    if (n) {
      const exists = out.some((o) => o.idroles === n.idroles);
      if (!exists) out.push(n);
    }
  }
  return out;
}

/* -------------------------------- Componente -------------------------------- */
export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // modal crear/editar
  const [openForm, setOpenForm] = useState(false);
  const [idroles, setIdroles] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const isEdit = useMemo(() => Boolean(idroles), [idroles]);

  // modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // modal ACL (Permisos / Privilegios)
  const [openACL, setOpenACL] = useState(false);
  const [aclTab, setAclTab] = useState("permisos"); // 'permisos' | 'privilegios'
  const [aclRole, setAclRole] = useState(null); // { idroles, descripcion }
  const [aclLoading, setAclLoading] = useState(false);
  const [aclSaving, setAclSaving] = useState(false);
  const [aclPermisos, setAclPermisos] = useState([]);     // string[]
  const [aclPrivilegios, setAclPrivilegios] = useState([]); // string[]

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // ref del formulario (para submit robusto)
  const formRef = useRef(null);

  async function loadRoles(q = "") {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const url = q ? API_URL + "?search=" + encodeURIComponent(q) : API_URL;
      const res = await axios.get(url);
      let list = extractManyRoles(res);

      // fallback por si el backend devuelve array directo
      if (!list.length) {
        const direct = res?.data ?? null;
        if (Array.isArray(direct)) {
          list = direct.map(normalizeRole).filter(Boolean);
        } else if (direct?.data && Array.isArray(direct.data)) {
          list = direct.data.map(normalizeRole).filter(Boolean);
        }
      }

      setRoles(list);
      setMsg("Resultados: " + list.length);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  function resetForm() {
    setIdroles("");
    setDescripcion("");
    setError("");
    setMsg("");
  }

  function onNew() {
    resetForm();
    setOpenForm(true);
    setTimeout(() => {
      formRef.current?.querySelector("#rolDescripcion")?.focus();
    }, 0);
  }

  async function onEdit(id) {
    setError("");
    setMsg("");
    try {
      const res = await axios.get(API_URL + "/" + id);
      const r = extractOneRole(res);
      if (!r) {
        setError("No se pudo leer el rol desde la API (estructura inesperada).");
        return;
      }
      setIdroles(r.idroles);
      setDescripcion(r.descripcion || "");
      setOpenForm(true);
      setMsg("Editando rol #" + r.idroles);
      setTimeout(() => {
        formRef.current?.querySelector("#rolDescripcion")?.focus();
      }, 0);
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
      setMsg("Rol eliminado");
      setOpenDelete(false);
      setDeleteId(null);
      await loadRoles(search);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const desc = (descripcion || "").trim();
    if (!desc) {
      setError("Ingresa la descripción");
      return;
    }
    try {
      if (isEdit) {
        await axios.put(API_URL + "/" + idroles, { descripcion: desc });
        setMsg("Rol actualizado");
      } else {
        await axios.post(API_URL, { descripcion: desc });
        setMsg("Rol creado");
      }
      setOpenForm(false);
      resetForm();
      await loadRoles(search);
    } catch (err2) {
      setError(err2?.response?.data?.msg || err2.message);
    }
  }

  const filtered = useMemo(() => {
    const s = (search || "").trim().toLowerCase();
    return roles.filter((r) => (r?.descripcion ? String(r.descripcion).toLowerCase() : "").includes(s));
  }, [roles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  /* ------------------- ACL handlers ------------------- */
  async function openAclModal(role, initialTab = "permisos") {
    setAclTab(initialTab);
    setAclRole(role);
    setOpenACL(true);
    setAclLoading(true);
    setError("");
    setMsg("");

    try {
      const { data } = await axios.get(`${API_URL}/${role.idroles}/acl`);
      // Estructura esperada: { ok?, idroles, permisos: string[], privilegios: string[] }
      const perms = Array.isArray(data?.permisos) ? data.permisos : [];
      const privs = Array.isArray(data?.privilegios) ? data.privilegios : [];
      setAclPermisos(perms);
      setAclPrivilegios(privs);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error cargando ACL");
      setAclPermisos([]);
      setAclPrivilegios([]);
    } finally {
      setAclLoading(false);
    }
  }

  function togglePermiso(key) {
    setAclPermisos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function togglePrivilegio(key) {
    setAclPrivilegios((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function saveAcl() {
    if (!aclRole) return;
    setAclSaving(true);
    setError("");
    setMsg("");
    try {
      await axios.put(`${API_URL}/${aclRole.idroles}/acl`, {
        permisos: aclPermisos,
        privilegios: aclPrivilegios,
      });
      setMsg("Permisos/Privilegios actualizados");
      setOpenACL(false);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Error guardando ACL");
    } finally {
      setAclSaving(false);
    }
  }

  return (
    <div className="roles-page">
      <header className="header">
        <div className="header-left">
          <h1>Roles</h1>
        </div>
        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar rol">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por descripción…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") loadRoles(search); }}
            />
          </div>

          <button className="btn primary" onClick={() => loadRoles(search)}>
            <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded" aria-hidden="true">add</span>
            Registrar nuevo rol
          </button>
        </div>
      </header>

      {loading && <p style={{ padding: "12px 32px" }}>Cargando roles…</p>}
      {!loading && msg ? <p className="note">{msg}</p> : null}
      {error ? <p className="note error">{error}</p> : null}

      <div className="tables-container">
        <table role="table" aria-label="Tabla de roles">
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
              pageItems.map((r) => (
                <tr key={r.idroles}>
                  <td style={{ fontWeight: 700, color: "#111827" }}>{r.idroles}</td>
                  <td style={{ color: "#374151" }}>{r.descripcion}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => onEdit(r.idroles)} title="Editar rol">
                        <span className="material-symbols-rounded" aria-hidden="true">edit</span>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => askDelete(r.idroles)} title="Eliminar rol">
                        <span className="material-symbols-rounded" aria-hidden="true">delete</span>
                        Eliminar
                      </button>

                      {/* NUEVOS BOTONES */}
                      <button
                        className="btn-acl"
                        onClick={() => openAclModal(r, "permisos")}
                        title="Configurar Permisos"
                      >
                        <span className="material-symbols-rounded" aria-hidden="true">tune</span>
                        Permisos
                      </button>
                      <button
                        className="btn-acl"
                        onClick={() => openAclModal(r, "privilegios")}
                        title="Configurar Privilegios"
                      >
                        <span className="material-symbols-rounded" aria-hidden="true">verified_user</span>
                        Privilegios
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
                <div className="modal-title" id="modalTitle">{isEdit ? "Editar Rol" : "Registrar Nuevo Rol"}</div>
                <div className="modal-sub">{isEdit ? `Editando #${idroles}` : "Crear nuevo rol de usuario"}</div>
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

            <form ref={formRef} onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="modal-user">
                  <div className="avatar-small">JP</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Juan Pérez</div>
                    <div style={{ fontSize: 13, color: "#666" }}>juan.perez@example.com</div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="rolDescripcion">Descripción</label>
                  <input
                    id="rolDescripcion"
                    type="text"
                    placeholder="Ej: Administrador"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        formRef.current?.requestSubmit();
                      }
                    }}
                    autoFocus
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
              <div className="modal-user">
                <div className="avatar-small">JP</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Juan Pérez</div>
                  <div style={{ fontSize: 13, color: "#666" }}>juan.perez@example.com</div>
                </div>
              </div>

              <div style={{ padding: "8px 4px 0 4px" }}>
                <p style={{ fontSize: 16, color: "#111827", marginBottom: 8 }}>Vas a eliminar el rol:</p>
                <p style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)", marginBottom: 12 }}>#{deleteId}</p>
                <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                  Confirma que <strong>Juan Pérez</strong> desea eliminar este registro permanentemente.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setOpenDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL ACL (Permisos/Privilegios) */}
      {openACL ? (
        <div
          className="modal show"
          aria-hidden="false"
          onClick={(e) => { if (e.target.classList.contains("modal")) setOpenACL(false); }}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="aclTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="aclTitle">
                  {aclRole ? `ACL – Rol #${aclRole.idroles} (${aclRole.descripcion})` : "Permisos & Privilegios"}
                </div>
                <div className="modal-sub">Define qué módulos y acciones puede usar este rol</div>
              </div>
              <button type="button" className="close-btn" aria-label="Cerrar" onClick={() => setOpenACL(false)}>
                &times;
              </button>
            </div>

            <div className="acl-tabs">
              <button
                type="button"
                className={`acl-tab ${aclTab === "permisos" ? "active" : ""}`}
                onClick={() => setAclTab("permisos")}
              >
                <span className="material-symbols-rounded" aria-hidden="true">tune</span>
                Permisos (Módulos)
              </button>
              <button
                type="button"
                className={`acl-tab ${aclTab === "privilegios" ? "active" : ""}`}
                onClick={() => setAclTab("privilegios")}
              >
                <span className="material-symbols-rounded" aria-hidden="true">verified_user</span>
                Privilegios (Acciones)
              </button>
            </div>

            <div className="modal-body">
              {aclLoading ? (
                <p style={{ padding: 8 }}>Cargando…</p>
              ) : aclTab === "permisos" ? (
                <div className="acl-grid">
                  {PERMISOS_LIST.map((p) => (
                    <label key={p.key} className={`acl-chip ${aclPermisos.includes(p.key) ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={aclPermisos.includes(p.key)}
                        onChange={() => togglePermiso(p.key)}
                      />
                      <span className="material-symbols-rounded" aria-hidden="true">folder</span>
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="acl-grid">
                  {PRIVILEGIOS_LIST.map((p) => (
                    <label key={p.key} className={`acl-chip ${aclPrivilegios.includes(p.key) ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={aclPrivilegios.includes(p.key)}
                        onChange={() => togglePrivilegio(p.key)}
                      />
                      <span className="material-symbols-rounded" aria-hidden="true">task_alt</span>
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {error ? <p className="note error" style={{ marginTop: 6 }}>{error}</p> : null}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel" onClick={() => setOpenACL(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={saveAcl}
                disabled={aclSaving}
              >
                <span className="material-symbols-rounded" aria-hidden="true">save</span>
                {aclSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
