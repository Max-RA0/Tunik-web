import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./servicios.styles.css";

const API_SVC = "https://tunik-api.onrender.com/api/servicios";
const API_CAT = "https://tunik-api.onrender.com/api/categoriaservicios";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nombreservicios: "",
    idcategoriaservicios: "",
    preciounitario: "",
  });

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const showAlert = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 3000);
  };

  const limpiarFormulario = () => {
    setForm({
      nombreservicios: "",
      idcategoriaservicios: "",
      preciounitario: "",
    });
  };

  async function fetchServicios() {
    setLoading(true);
    try {
      const res = await fetch(API_SVC, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) {
        setServicios(data.data || []);
      } else {
        setServicios([]);
      }
    } catch (err) {
      showAlert("error", "Error cargando servicios");
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
      if (data?.ok) setCategorias(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchServicios();
    fetchCategorias();
  }, []);

  function onNew() {
    setEditId(null);
    limpiarFormulario();
    setOpenForm(true);
  }

  async function onEdit(id) {
    try {
      const res = await fetch(`${API_SVC}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const s = data?.data;

      if (!s) return showAlert("error", "No se pudo leer el servicio");

      setEditId(s.idservicios);
      setForm({
        nombreservicios: s.nombreservicios,
        idcategoriaservicios: s.idcategoriaservicios,
        preciounitario: s.preciounitario,
      });
      setOpenForm(true);
    } catch (err) {
      showAlert("error", "Error leyendo servicio");
    }
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`${API_SVC}/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.ok) {
        showAlert("exito", "Servicio eliminado correctamente");
        setOpenDelete(false);
        setDeleteId(null);
        fetchServicios();
      } else {
        showAlert("error", data?.msg || "No se pudo eliminar");
      }
    } catch (err) {
      showAlert("error", "Error al eliminar");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    const nombre = form.nombreservicios.trim();
    if (!nombre) return showAlert("error", "El nombre es obligatorio");

    const payload = {
      nombreservicios: nombre,
      idcategoriaservicios: Number(form.idcategoriaservicios),
      preciounitario: Number(form.preciounitario),
    };

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
        showAlert("exito", editId ? "Servicio actualizado" : "Servicio creado");
        setOpenForm(false);
        setEditId(null);
        limpiarFormulario();
        fetchServicios();
      } else {
        showAlert("error", data?.msg || "Error al guardar");
      }
    } catch (err) {
      showAlert("error", "Error al guardar servicio");
    }
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return servicios;
    return servicios.filter((x) =>
      `${x.nombreservicios} ${x.preciounitario} ${x.categoriaservicios?.nombrecategorias ?? ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [servicios, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="roles-page">
      <header className="header">
        <h1>Servicios</h1>

        <div className="header-actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              type="search"
              className="search-input"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn primary" onClick={fetchServicios}>
            <span className="material-symbols-rounded">refresh</span> Recargar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span> Registrar
          </button>
        </div>
      </header>

      <div className="tables-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              pageItems.map((s) => (
                <tr key={s.idservicios}>
                  <td>{s.idservicios}</td>
                  <td>{s.nombreservicios}</td>
                  <td>{s.categoriaservicios?.nombrecategorias}</td>
                  <td>{s.preciounitario}</td>

                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(s.idservicios)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => askDelete(s.idservicios)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de eliminar */}
      {openDelete && (
        <div className="modal show">
          <div className="modal-dialog">
            <h3>¿Eliminar servicio #{deleteId}?</h3>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenDelete(false)}>
                Cancelar
              </button>

              <button className="btn btn-danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear/editar */}
      {openForm && (
        <div className="modal show">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editId ? "Editar Servicio" : "Registrar Servicio"}</h3>
              <button className="close-btn" onClick={() => setOpenForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <label>Nombre</label>
                <input
                  name="nombreservicios"
                  value={form.nombreservicios}
                  onChange={onFormChange}
                />

                <label>Categoría</label>
                <select
                  name="idcategoriaservicios"
                  value={form.idcategoriaservicios}
                  onChange={onFormChange}
                >
                  <option value="">Seleccione</option>
                  {categorias.map((c) => (
                    <option key={c.idcategoriaservicios} value={c.idcategoriaservicios}>
                      {c.nombrecategorias}
                    </option>
                  ))}
                </select>

                <label>Precio</label>
                <input
                  name="preciounitario"
                  type="number"
                  value={form.preciounitario}
                  onChange={onFormChange}
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-cancel" onClick={() => setOpenForm(false)} type="button">
                  Cancelar
                </button>
                <button className="btn primary" type="submit">
                  {editId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
