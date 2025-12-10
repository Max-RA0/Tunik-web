import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./productos.styles.css";

const API_URL = "https://tunik-api.onrender.com/api/productos";
const PROVEEDORES_API_URL = "https://tunik-api.onrender.com/api/proveedores";

function normalizeProducto(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.idproductos ?? raw.id ?? raw.IdProductos ?? null;
  if (id == null) return null;

  return {
    idproductos: Number(id),
    nombreproductos: String(raw.nombreproductos ?? raw.nombre ?? raw.NombreProductos ?? ""),
    precio: Number(raw.precio ?? raw.Precio ?? 0),
    cantidadexistente: Number(raw.cantidadexistente ?? raw.CantidadExistente ?? 0),
    idproveedor: Number(raw.idproveedor ?? raw.IdProveedor ?? 0),
  };
}

function normalizeProveedor(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.idproveedor ?? raw.id ?? raw.IdProveedor ?? raw.idproveedores ?? null;
  const nombre =
    raw.nombreproveedor ??
    raw.nombre ??
    raw.NombreProveedor ??
    raw.razonsocial ??
    raw.razon_social ??
    "";
  if (id == null) return null;
  return { id: Number(id), nombre: String(nombre) };
}

function getApiErrorMsg(err) {
  return (
    err?.response?.data?.msg ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Error"
  );
}

const HEADERS = ["ID", "Nombre", "Precio", "Cantidad", "Proveedor", "Acciones"];

export default function Productos() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => {
    const h = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    idproductos: null,
    nombreproductos: "",
    precio: "",
    cantidadexistente: "",
    idproveedor: "",
  });

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = useMemo(() => Boolean(formData.idproductos), [formData.idproductos]);

  const proveedorNombreById = useMemo(() => {
    const m = {};
    for (const p of proveedores) m[String(p.id)] = p.nombre;
    return m;
  }, [proveedores]);

  async function loadProveedores() {
    try {
      const res = await axios.get(PROVEEDORES_API_URL, { headers: headersAuth });
      const list = (Array.isArray(res.data) ? res.data : [])
        .map(normalizeProveedor)
        .filter(Boolean);
      setProveedores(list);
    } catch (err) {
      console.error("Error cargando proveedores:", err?.response?.data || err);
      setError(getApiErrorMsg(err) || "Error cargando la lista de proveedores.");
    }
  }

  async function loadProductos() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_URL, { headers: headersAuth });
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setProductos((Array.isArray(arr) ? arr : []).map(normalizeProducto).filter(Boolean));
    } catch (err) {
      console.error("Error cargando productos:", err?.response?.data || err);
      setError(getApiErrorMsg(err) || "Error cargando productos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductos();
    loadProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombreproductos.trim()) errors.nombreproductos = "El nombre es obligatorio.";
    if (formData.precio === "" || isNaN(formData.precio) || Number(formData.precio) <= 0)
      errors.precio = "Precio inválido o requerido.";
    if (
      formData.cantidadexistente === "" ||
      isNaN(formData.cantidadexistente) ||
      Number(formData.cantidadexistente) < 0
    )
      errors.cantidadexistente = "Cantidad inválida o requerida.";
    if (formData.idproveedor === "" || Number(formData.idproveedor) <= 0)
      errors.idproveedor = "Proveedor es obligatorio.";
    return errors;
  };

  const resetForm = () => {
    setFormData({
      idproductos: null,
      nombreproductos: "",
      precio: "",
      cantidadexistente: "",
      idproveedor: "",
    });
    setError("");
    setMsg("");
  };

  const onNew = () => {
    resetForm();
    setOpenForm(true);
  };

  async function onEdit(id) {
    try {
      const res = await axios.get(`${API_URL}/${id}`, { headers: headersAuth });
      const p = normalizeProducto(res.data?.data ?? res.data);
      if (!p) throw new Error("No se pudo obtener el producto");

      setFormData({
        idproductos: p.idproductos,
        nombreproductos: p.nombreproductos,
        precio: String(p.precio ?? ""),
        cantidadexistente: String(p.cantidadexistente ?? ""),
        idproveedor: String(p.idproveedor ?? ""),
      });

      setOpenForm(true);
    } catch (err) {
      console.error("Error edit producto:", err?.response?.data || err);
      setError(getApiErrorMsg(err));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError("Por favor, corrige los errores en el formulario.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const dataToSend = {
      nombreproductos: formData.nombreproductos.trim(),
      precio: Number(formData.precio),
      cantidadexistente: Number(formData.cantidadexistente),
      idproveedor: Number(formData.idproveedor),
    };

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${formData.idproductos}`, dataToSend, { headers: headersAuth });
        setMsg("Producto actualizado correctamente.");
      } else {
        await axios.post(API_URL, dataToSend, { headers: headersAuth });
        setMsg("Producto creado correctamente.");
      }
      setOpenForm(false);
      resetForm();
      await loadProductos();
    } catch (err) {
      console.error("Error submit producto:", err?.response?.data || err);
      setError(getApiErrorMsg(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const askDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  async function confirmDelete() {
    try {
      await axios.delete(`${API_URL}/${deleteId}`, { headers: headersAuth });
      setMsg("Producto eliminado correctamente.");
      setOpenDelete(false);
      await loadProductos();
    } catch (err) {
      console.error("Error delete producto:", err?.response?.data || err);
      setError(getApiErrorMsg(err));
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return productos.filter((p) => p.nombreproductos.toLowerCase().includes(s));
  }, [productos, search]);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="productos-page">
      <header className="header">
        <h1>Gestión de Productos</h1>
        <div className="header-actions">
          <input
            className="search-input"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span>
            Registrar producto
          </button>
        </div>
      </header>

      {loading && <p>Cargando productos...</p>}
      {msg && <p className="note">{msg}</p>}
      {error && <p className="note error">{error}</p>}

      <table>
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {!loading && pageItems.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                Sin registros
              </td>
            </tr>
          ) : (
            pageItems.map((p) => {
              const provName = proveedorNombreById[String(p.idproveedor)];
              return (
                <tr key={p.idproductos}>
                  <td>{p.idproductos}</td>
                  <td>{p.nombreproductos}</td>
                  <td>${p.precio}</td>
                  <td>{p.cantidadexistente}</td>
                  <td>{provName || `#${p.idproveedor}`}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => onEdit(p.idproductos)}>
                        Editar
                      </button>
                      <button className="btn-delete" onClick={() => askDelete(p.idproductos)}>
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

      {openForm && (
        <div
          className="modal show"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setOpenForm(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">{isEdit ? "Editar Producto" : "Registrar Producto"}</div>
              <button className="close-btn" onClick={() => setOpenForm(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate>
              <div className="modal-body">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombreproductos"
                  value={formData.nombreproductos}
                  onChange={handleChange}
                />

                <label>Precio</label>
                <input type="number" name="precio" value={formData.precio} onChange={handleChange} />

                <label>Cantidad existente</label>
                <input
                  type="number"
                  name="cantidadexistente"
                  value={formData.cantidadexistente}
                  onChange={handleChange}
                />

                <label>Proveedor</label>

                {proveedores.length > 0 ? (
                  <select name="idproveedor" value={formData.idproveedor} onChange={handleChange}>
                    <option value="">Seleccione un Proveedor</option>
                    {proveedores.map((prov) => (
                      <option key={prov.id} value={String(prov.id)}>
                        {prov.nombre} (ID: {prov.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    name="idproveedor"
                    placeholder="ID del Proveedor"
                    value={formData.idproveedor}
                    onChange={handleChange}
                  />
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDelete && (
        <div
          className="modal modal-delete show"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) setOpenDelete(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">Confirmar eliminación</div>
              <button className="close-btn" onClick={() => setOpenDelete(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>¿Eliminar producto #{deleteId}?</p>
            </div>
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
    </div>
  );
}
