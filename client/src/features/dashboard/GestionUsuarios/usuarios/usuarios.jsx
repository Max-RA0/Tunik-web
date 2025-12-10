import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./usuarios.styles.css";

const API_USERS = "https://tunik-api.onrender.com/api/usuarios";
const API_ROLES = "https://tunik-api.onrender.com/api/roles";

const EMPTY_FORM = {
  numero_documento: "",
  tipo_documento: "",
  nombre: "",
  telefono: "",
  email: "",
  contrasena: "",
  idroles: "",
};

function onlyDigits(str) {
  return String(str || "").replace(/\D/g, "");
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || "").trim());
}
function normalizePhone(raw) {
  return String(raw || "").replace(/[^\d+]/g, "").trim();
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  // ✅ feedback SOLO modal
  const [msgModal, setMsgModal] = useState("");
  const [errorModal, setErrorModal] = useState("");

  // Modal crear/editar (estilo Vehículos)
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Modal eliminar
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const clearModalFeedback = () => {
    setMsgModal("");
    setErrorModal("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setEditando(false);
  };

  const cerrarModalForm = () => {
    setMostrarForm(false);
    resetForm(); // ✅ limpia SIEMPRE al cerrar
    clearModalFeedback();
  };

  const cerrarModalDelete = () => {
    setOpenDelete(false);
    setDeleteId(null);
    clearModalFeedback();
  };

  // ------------------ Cargar datos ------------------
  async function fetchUsuarios() {
    setLoading(true);
    try {
      const res = await fetch(API_USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        navigate("/");
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setUsuarios(data.data || []);
      } else {
        setUsuarios([]);
      }
    } catch (err) {
      setUsuarios([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch(API_ROLES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) setRoles(data.data || []);
    } catch (err) {
      console.error("fetchRoles:", err);
    }
  }

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------ Handlers ------------------
  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "numero_documento") return setField(name, onlyDigits(value));
    if (name === "telefono") return setField(name, normalizePhone(value));
    setField(name, value);
  };

  const abrirFormularioNuevo = () => {
    clearModalFeedback();
    resetForm(); // ✅ evita datos pegados
    setEditando(false);
    setEditId(null);
    setMostrarForm(true);
  };

  const handleEditar = (u) => {
    clearModalFeedback();
    resetForm(); // ✅ limpia y luego carga
    setEditando(true);
    setEditId(u.numero_documento);

    setForm({
      numero_documento: String(u.numero_documento ?? ""),
      tipo_documento: String(u.tipo_documento ?? ""),
      nombre: String(u.nombre ?? ""),
      telefono: String(u.telefono ?? ""),
      email: String(u.email ?? ""),
      contrasena: "",
      idroles: String(u.idroles || u.roles?.idroles || ""),
    });

    setMostrarForm(true);
  };

  const askDelete = (numero_documento) => {
    clearModalFeedback();
    setDeleteId(numero_documento);
    setOpenDelete(true);
  };

  const validate = () => {
    const v = {
      ...form,
      numero_documento: onlyDigits(form.numero_documento),
      tipo_documento: String(form.tipo_documento || "").trim(),
      nombre: String(form.nombre || "").trim(),
      telefono: normalizePhone(form.telefono),
      email: String(form.email || "").trim(),
      contrasena: String(form.contrasena || ""),
      idroles: String(form.idroles || "").trim(),
    };

    const next = {};

    if (!editando) {
      if (!v.numero_documento) next.numero_documento = "El número de documento es obligatorio.";
      if (v.numero_documento && v.numero_documento.length < 5)
        next.numero_documento = "Documento inválido (muy corto).";
    }

    if (!v.tipo_documento) next.tipo_documento = "Tipo de documento obligatorio.";
    if (!v.nombre) next.nombre = "Nombre obligatorio.";

    if (!v.telefono) next.telefono = "Teléfono obligatorio.";
    if (v.telefono && v.telefono.replace(/\D/g, "").length < 7)
      next.telefono = "Teléfono inválido (muy corto).";

    if (!v.email) next.email = "Correo obligatorio.";
    if (v.email && !isValidEmail(v.email)) next.email = "Correo inválido.";

    if (!v.idroles) next.idroles = "Selecciona un rol.";

    if (!editando) {
      if (!v.contrasena) next.contrasena = "Contraseña obligatoria al crear.";
      if (v.contrasena && v.contrasena.length < 6) next.contrasena = "Mínimo 6 caracteres.";
    } else {
      if (v.contrasena && v.contrasena.length < 6) next.contrasena = "Si cambias la contraseña: mínimo 6.";
    }

    setErrors(next);
    setForm(v);
    return Object.keys(next).length === 0;
  };

  // ------------------ CRUD ------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    clearModalFeedback();

    if (!validate()) {
      setErrorModal("Revisa los campos marcados.");
      return;
    }

    const url = editando ? `${API_USERS}/${editId}` : API_USERS;
    const method = editando ? "PUT" : "POST";

    const payload = {
      numero_documento: form.numero_documento,
      tipo_documento: form.tipo_documento,
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      idroles: Number(form.idroles),
      contrasena: form.contrasena,
    };

    if (editando) {
      delete payload.numero_documento;
      if (!payload.contrasena || payload.contrasena.trim() === "") delete payload.contrasena;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorModal(data?.msg || `Error ${res.status} al guardar usuario`);
        return;
      }

      setMsgModal(editando ? "Usuario actualizado correctamente" : "Usuario registrado correctamente");
      await fetchUsuarios();
      setTimeout(() => cerrarModalForm(), 700);
    } catch (err) {
      setErrorModal(err.message || "Error guardando usuario");
    }
  };

  const confirmDelete = async () => {
    clearModalFeedback();
    try {
      const res = await fetch(`${API_USERS}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (data?.ok) {
        setMsgModal("Usuario eliminado correctamente");
        await fetchUsuarios();
        setTimeout(() => cerrarModalDelete(), 600);
      } else {
        setErrorModal(data?.msg || "No se pudo eliminar el usuario.");
      }
    } catch (err) {
      setErrorModal(err.message || "Error eliminando usuario");
    }
  };

  // ------------------ Filtro (SIN paginado) ------------------
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const rolTxt = u.roles?.descripcion || String(u.idroles || "");
      return (
        String(u.numero_documento || "").toLowerCase().includes(q) ||
        String(u.tipo_documento || "").toLowerCase().includes(q) ||
        String(u.nombre || "").toLowerCase().includes(q) ||
        String(u.telefono || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(rolTxt || "").toLowerCase().includes(q)
      );
    });
  }, [usuarios, search]);

  // ------------------ Render ------------------
  return (
    <div className="usuarios-module">
      <header className="usuarios-header">
        <div>
          <h1 className="usuarios-title">Usuarios</h1>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
            Gestión de usuarios registrados
          </div>
        </div>

        <div className="usuarios-actions">
          <div className="search-wrap">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por documento, nombre, correo o rol…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn" onClick={fetchUsuarios}>
            <span className="material-symbols-rounded">refresh</span>
            Refrescar
          </button>

          <button className="btn dark" onClick={abrirFormularioNuevo}>
            <span className="material-symbols-rounded">add</span>
            Registrar usuario
          </button>
        </div>
      </header>

      <div className="usuarios-table-wrap">
        {loading && <p style={{ padding: "12px 0" }}>Cargando usuarios…</p>}

        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Número Documento</th>
              <th>Tipo</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#6b7280", fontStyle: "italic" }}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.numero_documento}>
                  <td style={{ fontWeight: 700 }}>{u.numero_documento}</td>
                  <td>{u.tipo_documento}</td>
                  <td>{u.nombre}</td>
                  <td>{u.telefono}</td>
                  <td>{u.email}</td>
                  <td>{u.roles?.descripcion || u.idroles}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={() => handleEditar(u)}>
                        <span className="material-symbols-rounded">edit</span>
                        Editar
                      </button>
                      <button className="row-btn danger" onClick={() => askDelete(u.numero_documento)}>
                        <span className="material-symbols-rounded">delete</span>
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

      {/* 🔴 MODAL ELIMINAR */}
      {openDelete && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && cerrarModalDelete()}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">Confirmar Eliminación</div>
                <div className="modal-sub">Esta acción no se puede deshacer</div>
              </div>
              <button type="button" className="close-x" onClick={cerrarModalDelete}>
                &times;
              </button>
            </div>

            <div className="modal-body modal-onecol">
              <div style={{ fontSize: 16, color: "#111827" }}>Vas a eliminar el usuario con documento:</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#be1e2d" }}>{deleteId}</div>
              <div style={{ color: "#6b7280" }}>Confirma que deseas eliminar este registro permanentemente.</div>

              {/* ✅ Alertas SOLO en modal */}
              {errorModal && <div className="modal-alert modal-alert--error">{errorModal}</div>}
              {msgModal && <div className="modal-alert modal-alert--ok">{msgModal}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={cerrarModalDelete}>
                Cancelar
              </button>
              <button className="btn dark" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && cerrarModalForm()}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editando ? "Editar usuario" : "Registrar usuario"}</div>
                <div className="modal-sub">{editando ? "Actualiza los datos del usuario" : "Completa los datos del usuario"}</div>
              </div>
              <button type="button" className="close-x" onClick={cerrarModalForm}>
                &times;
              </button>
            </div>

            {/* ✅ anti-autofill */}
            <form onSubmit={onSubmit} autoComplete="off" key={editando ? `edit-${editId}` : "new"}>
              {/* Campos “trampa” (Chrome) */}
              <input
                type="text"
                name="fake_username"
                autoComplete="username"
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
                tabIndex={-1}
              />
              <input
                type="password"
                name="fake_password"
                autoComplete="current-password"
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
                tabIndex={-1}
              />

              <div className="modal-body">
                {!editando && (
                  <div className="form-col">
                    <label>Documento</label>
                    <input
                      type="text"
                      name="numero_documento"
                      placeholder="Solo números"
                      value={form.numero_documento}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                      inputMode="numeric"
                    />
                    {errors.numero_documento && <div className="field-error">{errors.numero_documento}</div>}
                  </div>
                )}

                <div className="form-col">
                  <label>Tipo documento</label>
                  <input
                    type="text"
                    name="tipo_documento"
                    placeholder="Ej: CC, TI, CE"
                    value={form.tipo_documento}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                  {errors.tipo_documento && <div className="field-error">{errors.tipo_documento}</div>}
                </div>

                <div className="form-col">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre completo"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                  {errors.nombre && <div className="field-error">{errors.nombre}</div>}
                </div>

                <div className="form-col">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    placeholder="Ej: 3001234567"
                    value={form.telefono}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    inputMode="tel"
                  />
                  {errors.telefono && <div className="field-error">{errors.telefono}</div>}
                </div>

                <div className="form-col">
                  <label>Correo</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="correo@dominio.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>

                <div className="form-col">
                  <label>{editando ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
                  <input
                    type="password"
                    name="contrasena"
                    placeholder={editando ? "Deja vacío para no cambiar" : "Mínimo 6 caracteres"}
                    value={form.contrasena}
                    onChange={handleChange}
                    required={!editando}
                    autoComplete="new-password"
                  />
                  {errors.contrasena && <div className="field-error">{errors.contrasena}</div>}
                </div>

                <div className="form-col" style={{ gridColumn: "1 / -1" }}>
                  <label>Rol</label>
                  <select name="idroles" value={form.idroles} onChange={handleChange} required autoComplete="off">
                    <option value="">Seleccione rol</option>
                    {roles.map((r) => (
                      <option key={r.idroles} value={r.idroles}>
                        {r.descripcion}
                      </option>
                    ))}
                  </select>
                  {errors.idroles && <div className="field-error">{errors.idroles}</div>}
                </div>

                {/* ✅ Alertas SOLO en modal */}
                {errorModal && <div className="modal-alert modal-alert--error">{errorModal}</div>}
                {msgModal && <div className="modal-alert modal-alert--ok">{msgModal}</div>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={cerrarModalForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn dark">
                  <span className="material-symbols-rounded">check</span>
                  {editando ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
