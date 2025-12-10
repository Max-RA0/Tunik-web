import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./roles.styles.css";

const API_URL = "https://tunik-api.onrender.com/api/roles";

const ROLE_ADMIN = "Administrador";
const ROLE_CLIENTE = "Cliente";
const ALLOWED_ROLES = [ROLE_ADMIN, ROLE_CLIENTE];

/* ------------------- Helpers básicos ------------------- */
function initialsFrom(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => (n[0] || "").toUpperCase())
    .join("");
}

function normText(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeRoleName(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const lower = normText(t);
  if (lower === normText(ROLE_ADMIN)) return ROLE_ADMIN;
  if (lower === normText(ROLE_CLIENTE)) return ROLE_CLIENTE;
  return t; // (no permitido para guardar, pero útil para ver)
}

/* ------------------- Normalizadores de ROLES ------------------- */
function normalizeRole(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id =
    raw.idroles ??
    raw.idrol ??
    raw.id ??
    raw.role_id ??
    raw.roleId ??
    raw.Id ??
    raw.IdRol ??
    null;

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

function extractOneRole(res) {
  const d = res?.data ?? null;
  const cands = [];
  if (d?.data) cands.push(d.data);
  if (d?.role) cands.push(d.role);
  if (d?.item) cands.push(d.item);
  if (d) cands.push(d);

  for (const c of cands) {
    if (Array.isArray(c)) {
      for (const item of c) {
        const n = normalizeRole(item);
        if (n) return n;
      }
    } else {
      const n = normalizeRole(c);
      if (n) return n;
    }
  }
  return null;
}

/* -------------------------------- Componente -------------------------------- */
export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [idroles, setIdroles] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const isEdit = useMemo(() => Boolean(idroles), [idroles]);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDesc, setDeleteDesc] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const formRef = useRef(null);

  const sessionUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "null");
    } catch {
      return null;
    }
  }, []);
  const sessionName = sessionUser?.nombre || sessionUser?.name || "Usuario";
  const sessionEmail = sessionUser?.email || "usuario@example.com";
  const sessionInitials = initialsFrom(sessionName);

  async function loadRoles(q = "") {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const url = q ? API_URL + "?search=" + encodeURIComponent(q) : API_URL;
      const res = await axios.get(url);
      const list = extractManyRoles(res);

      // Opcional: ordenar para que se vea bonito (Admin, Cliente, luego lo demás)
      const nsAdmin = normText(ROLE_ADMIN);
      const nsCliente = normText(ROLE_CLIENTE);
      list.sort((a, b) => {
        const aa = normText(a.descripcion);
        const bb = normText(b.descripcion);
        const pa = aa === nsAdmin ? 0 : aa === nsCliente ? 1 : 2;
        const pb = bb === nsAdmin ? 0 : bb === nsCliente ? 1 : 2;
        if (pa !== pb) return pa - pb;
        return String(a.descripcion).localeCompare(String(b.descripcion));
      });

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
    setTimeout(() => formRef.current?.querySelector("#rolDescripcion")?.focus(), 0);
  }

  async function onEdit(id) {
    setError("");
    setMsg("");
    try {
      const res = await axios.get(API_URL + "/" + id);
      const r = extractOneRole(res);
      if (!r) return setError("No se pudo leer el rol desde la API (estructura inesperada).");
      setIdroles(r.idroles);
      setDescripcion(r.descripcion || "");
      setOpenForm(true);
      setMsg("Editando rol #" + r.idroles);
      setTimeout(() => formRef.current?.querySelector("#rolDescripcion")?.focus(), 0);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  function askDelete(role) {
    setDeleteId(role?.idroles);
    setDeleteDesc(role?.descripcion || "");
    setOpenDelete(true);
  }

  async function confirmDelete() {
    setError("");
    try {
      const nd = normText(deleteDesc);
      if (nd === normText(ROLE_ADMIN) || nd === normText(ROLE_CLIENTE)) {
        return setError("No puedes eliminar un rol base del sistema (Administrador/Cliente).");
      }

      await axios.delete(API_URL + "/" + deleteId);
      setMsg("Rol eliminado");
      setOpenDelete(false);
      setDeleteId(null);
      setDeleteDesc("");
      await loadRoles(search);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const descRaw = (descripcion || "").trim();
    if (!descRaw) return setError("La descripción es obligatoria (no puede quedar vacía).");

    // ✅ Solo 2 roles permitidos
    const fixed = normalizeRoleName(descRaw);
    const allowed = ALLOWED_ROLES.some((r) => normText(r) === normText(fixed));
    if (!allowed) {
      return setError(`Solo se permiten estos roles: ${ALLOWED_ROLES.join(" y ")}.`);
    }

    // ✅ NO duplicados
    const wanted = normText(fixed);
    const dup = roles.some((r) => {
      const same = normText(r?.descripcion) === wanted;
      if (!same) return false;
      if (!isEdit) return true;
      return Number(r?.idroles) !== Number(idroles);
    });
    if (dup) return setError("Ese rol ya existe. Usa un nombre diferente.");

    try {
      if (isEdit) {
        await axios.put(API_URL + "/" + idroles, { descripcion: fixed });
        setMsg("Rol actualizado");
      } else {
        await axios.post(API_URL, { descripcion: fixed });
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
    return roles.filter((r) =>
      (r?.descripcion ? String(r.descripcion).toLowerCase() : "").includes(s)
    );
  }, [roles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="roles-page">
      <header className="header">
        <div className="header-left">
          <h1>Roles</h1>
        </div>

        <div className="header-actions">
          <div className="search-wrapper" role="search" aria-label="Buscar rol">
            <span className="material-symbols-rounded search-icon" aria-hidden="true">
              search
            </span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por descripción…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadRoles(search);
              }}
            />
          </div>

          <button className="btn primary" onClick={() => loadRoles(search)}>
            <span className="material-symbols-rounded" aria-hidden="true">
              refresh
            </span>
            Buscar
          </button>

          <button className="btn primary" onClick={onNew} title="Solo permite Administrador o Cliente">
            <span className="material-symbols-rounded" aria-hidden="true">
              add
            </span>
            Registrar nuevo rol
          </button>
        </div>
      </header>

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
                <td
                  colSpan={3}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageItems.map((r) => {
                const isBase =
                  normText(r.descripcion) === normText(ROLE_ADMIN) ||
                  normText(r.descripcion) === normText(ROLE_CLIENTE);

                return (
                  <tr key={r.idroles}>
                    <td style={{ fontWeight: 700, color: "#111827" }}>{r.idroles}</td>
                    <td style={{ color: "#374151" }}>{normalizeRoleName(r.descripcion)}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn-edit"
                          onClick={() => onEdit(r.idroles)}
                          title="Editar rol"
                        >
                          <span className="material-symbols-rounded" aria-hidden="true">
                            edit
                          </span>{" "}
                          Editar
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => askDelete(r)}
                          title={isBase ? "No se puede eliminar un rol base" : "Eliminar rol"}
                          disabled={isBase}
                          style={isBase ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                        >
                          <span className="material-symbols-rounded" aria-hidden="true">
                            delete
                          </span>{" "}
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
          onClick={(e) => e.target.classList.contains("modal") && setOpenForm(false)}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="modalTitle">
                  {isEdit ? "Editar Rol" : "Registrar Nuevo Rol"}
                </div>
                <div className="modal-sub">
                  {isEdit ? `Editando #${idroles}` : "Solo puedes crear Administrador o Cliente"}
                </div>
              </div>
              <button type="button" className="close-btn" aria-label="Cerrar" onClick={() => setOpenForm(false)}>
                &times;
              </button>
            </div>

            <form ref={formRef} onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="modal-user">
                  <div className="avatar-small">{sessionInitials || "US"}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{sessionName}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{sessionEmail}</div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="rolDescripcion">Descripción</label>
                  <select
                    id="rolDescripcion"
                    value={normalizeRoleName(descripcion)}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un rol…
                    </option>
                    <option value={ROLE_ADMIN}>{ROLE_ADMIN}</option>
                    <option value={ROLE_CLIENTE}>{ROLE_CLIENTE}</option>
                  </select>

                  <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                    Roles permitidos: <strong>{ROLE_ADMIN}</strong> y <strong>{ROLE_CLIENTE}</strong>.
                  </div>
                </div>

                {error ? (
                  <p className="note error" style={{ marginTop: 6 }}>
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  <span className="material-symbols-rounded" aria-hidden="true">
                    check
                  </span>
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
          onClick={(e) => e.target.classList.contains("modal") && setOpenDelete(false)}
        >
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
            <div className="modal-header">
              <div>
                <div className="modal-title" id="deleteTitle">
                  Confirmar Eliminación
                </div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button type="button" className="close-btn" aria-label="Cerrar" onClick={() => setOpenDelete(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-user">
                <div className="avatar-small">{sessionInitials || "US"}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{sessionName}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{sessionEmail}</div>
                </div>
              </div>

              <div style={{ padding: "8px 4px 0 4px" }}>
                <p style={{ fontSize: 16, color: "#111827", marginBottom: 8 }}>
                  Vas a eliminar el rol:
                </p>
                <p style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)", marginBottom: 6 }}>
                  #{deleteId} – {normalizeRoleName(deleteDesc)}
                </p>
                <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                  Confirma que <strong>{sessionName}</strong> desea eliminar este registro permanentemente.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-cancel" onClick={() => setOpenDelete(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
