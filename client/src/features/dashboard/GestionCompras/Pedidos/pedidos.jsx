// client/src/features/dashboard/Gestionventas/pedidos/pedidos.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./pedidos.styles.css";

const API_PED = "https://tunik-api.onrender.com/api/pedidos";
const API_PROV = "https://tunik-api.onrender.com/api/proveedores";
const API_PROD = "https://tunik-api.onrender.com/api/productos";

const EMPTY_PEDIDO_FORM = {
  idproveedor: "",
  fechaPedido: "",
  estado: "Pendiente",
};

export default function Pedidos() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => {
    const h = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [search, setSearch] = useState("");

  // modal crear/editar pedido
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_PEDIDO_FORM);

  // detalle (carrito)
  const [items, setItems] = useState([]);

  // modal picker productos
  const [openPicker, setOpenPicker] = useState(false);
  const [prodPage, setProdPage] = useState(1);
  const PAGE_SIZE = 8;
  const [prodSearch, setProdSearch] = useState("");

  // modal eliminar pedido
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // modal ver detalle
  const [openView, setOpenView] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [viewItems, setViewItems] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  /* ---------------- Helpers ---------------- */

  const showAlert = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    window.clearTimeout(showAlert._t);
    showAlert._t = window.setTimeout(
      () => setAlerta({ tipo: "", mensaje: "" }),
      3200
    );
  };

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  const resetPedido = () => {
    setForm(EMPTY_PEDIDO_FORM);
    setItems([]);
    setEditId(null);
    setProdPage(1);
    setProdSearch("");
  };

  const formatDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const formatDateDisplay = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  const proveedorNombre = (prov) =>
    prov?.nombreproveedor || prov?.nombre || prov?.nombreempresa || "";

  const money = (n) => Number(n || 0).toLocaleString("es-CO");

  const getPedidoId = (p) =>
    p?.idpedidos ?? p?.idpedido ?? p?.id ?? p?.IdPedido ?? null;

  const getProducto = (idproductos) =>
    productos.find((p) => String(p.idproductos) === String(idproductos)) || null;

  const getProductoProveedorId = (p) =>
    p?.idproveedor ?? p?.idProveedor ?? p?.proveedor_id ?? p?.proveedorId ?? null;

  const anyProdHasProveedor = useMemo(
    () => productos.some((p) => getProductoProveedorId(p) != null),
    [productos]
  );

  const proveedoresMap = useMemo(() => {
    const m = new Map();
    safeArray(proveedores).forEach((pr) => {
      const id = pr?.idproveedor ?? pr?.idProveedor ?? pr?.id ?? pr?.proveedor_id;
      if (id == null) return;
      m.set(String(id), proveedorNombre(pr) || `Proveedor ${id}`);
    });
    return m;
  }, [proveedores]);

  const getProveedorNombreById = (id) => {
    const key = String(id ?? "");
    return proveedoresMap.get(key) || (key ? `Proveedor ${key}` : "");
  };

  const getProveedorNombrePedido = (pedido) => {
    const joined = proveedorNombre(pedido?.proveedor);
    if (joined) return joined;

    const id =
      pedido?.idproveedor ??
      pedido?.idProveedor ??
      pedido?.proveedor_id ??
      pedido?.proveedorId ??
      "";

    return id ? getProveedorNombreById(id) : "";
  };

  // extrae arrays robustamente (incluye "detalles" del include sequelize)
  const extractRows = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.detalle)) return data.detalle;
    if (Array.isArray(data?.detalles)) return data.detalles;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.productos)) return data.productos;
    if (Array.isArray(data?.detallepedidos)) return data.detallepedidos;
    if (Array.isArray(data?.detallePedidos)) return data.detallePedidos;
    return [];
  };

  // mapea rows a {idproductos, cantidad}
  // soporta: detallepedidoproducto (idproducto/idproductos) + cualquier forma vieja
  const mapDetalleRows = (rows) =>
    safeArray(rows)
      .map((d) => {
        const idProd =
          d?.idproductos ??
          d?.idproducto ??
          d?.idProducto ??
          d?.producto_id ??
          d?.productoId ??
          d?.idproducto ??
          null;

        const qty =
          d?.cantidad ??
          d?.qty ??
          d?.cant ??
          d?.cantidad_pedido ??
          d?.cantidadProducto ??
          1;

        if (idProd == null) return null;

        return {
          idproductos: String(idProd),
          cantidad: Math.max(1, Number(qty) || 1),
        };
      })
      .filter(Boolean);

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, { headers: headersAuth, ...options });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  };

  // ✅ lee pedido + items desde /api/pedidos/:id (una sola fuente)
  const parsePedidoAndItems = (apiData) => {
    // El backend devuelve: { ok:true, data: { ...pedido, detalles: [...], items:[...] } }
    const base = apiData?.data ?? apiData;
    if (!base) return { pedido: null, items: [] };

    // Caso A: { pedido: {...}, items: [...] }
    if (base?.pedido) {
      const pedido = base.pedido;
      const rawItems =
        base.items ??
        base.detalles ??
        base.detalle ??
        base.detallepedidos ??
        base.detallePedidos ??
        base.productos ??
        pedido?.items ??
        pedido?.detalles ??
        pedido?.detalle ??
        pedido?.detallepedidos ??
        pedido?.detallePedidos ??
        pedido?.productos ??
        [];
      return { pedido, items: mapDetalleRows(extractRows(rawItems)) };
    }

    // Caso B: pedido directo con include "detalles" y/o "items"
    const pedido = base;
    const rawItems =
      pedido?.items ?? // si backend ya manda items normalizados
      pedido?.detalles ?? // include sequelize
      pedido?.detalle ??
      pedido?.detallepedidos ??
      pedido?.detallePedidos ??
      pedido?.productos ??
      [];
    return { pedido, items: mapDetalleRows(extractRows(rawItems)) };
  };

  const fetchPedidoDetail = async (id) => {
    try {
      const { res, data } = await fetchJson(`${API_PED}/${id}`);
      if (!res.ok) return { pedido: null, items: [] };
      return parsePedidoAndItems(data);
    } catch (e) {
      console.error(e);
      return { pedido: null, items: [] };
    }
  };

  /* ---------------- Combos ---------------- */

  const loadCombos = async () => {
    try {
      const [resProv, resProd] = await Promise.all([
        fetch(API_PROV, { headers: headersAuth }),
        fetch(API_PROD, { headers: headersAuth }),
      ]);

      const dataProv = await resProv.json();
      const dataProd = await resProd.json();

      setProveedores(Array.isArray(dataProv) ? dataProv : safeArray(dataProv?.data));
      setProductos(Array.isArray(dataProd) ? dataProd : safeArray(dataProd?.data));
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------------- Pedidos ---------------- */

  async function fetchPedidos() {
    setLoading(true);
    try {
      const res = await fetch(API_PED, { headers: headersAuth });
      const data = await res.json();
      const rows = data?.ok ? safeArray(data.data) : extractRows(data);

      setPedidos(rows);
      if (!rows.length) showAlert("info", data?.msg || "No se encontraron pedidos");
    } catch (err) {
      console.error(err);
      showAlert("error", "Error cargando pedidos");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPedidos();
    loadCombos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- CRUD pedido ---------------- */

  function onNew() {
    resetPedido();
    setOpenForm(true);
  }

  async function onEdit(id) {
    try {
      const { pedido, items: its } = await fetchPedidoDetail(id);
      if (!pedido) return showAlert("error", "No se pudo leer el pedido");

      const pedidoId = getPedidoId(pedido) ?? id;
      const provId = String(
        pedido?.idproveedor ??
          pedido?.idProveedor ??
          pedido?.proveedor_id ??
          pedido?.proveedorId ??
          ""
      );

      setEditId(pedidoId);
      setForm({
        idproveedor: provId,
        fechaPedido: formatDateInput(pedido.fechaPedido),
        estado: pedido.estado || "Pendiente",
      });

      setProdPage(1);
      setProdSearch("");
      setItems(its);

      setOpenForm(true);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error leyendo el pedido");
    }
  }

  async function onView(id) {
    setViewLoading(true);
    setViewId(id);
    setViewItems([]);
    try {
      const { items: its } = await fetchPedidoDetail(id);
      setViewItems(its);
      setOpenView(true);
    } catch (e) {
      console.error(e);
      showAlert("error", "Error cargando el detalle");
    } finally {
      setViewLoading(false);
    }
  }

  function askDelete(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    try {
      const { res, data } = await fetchJson(`${API_PED}/${deleteId}`, {
        method: "DELETE",
      });

      if (res.ok && data?.ok) {
        showAlert("exito", data?.msg || "Pedido eliminado correctamente");
        setOpenDelete(false);
        setDeleteId(null);
        fetchPedidos();
        loadCombos();
      } else {
        showAlert("error", data?.msg || "No se pudo eliminar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al eliminar");
    }
  }

  // cambiar proveedor: si cambia y hay items -> vacía
  function changeProveedor(next) {
    const prevId = String(form.idproveedor || "");
    const nextId = String(next || "");
    if (items.length > 0 && prevId !== nextId) setItems([]);
    setForm((prev) => ({ ...prev, idproveedor: nextId }));
    setProdPage(1);
    setProdSearch("");
  }

  function onProveedorChange(e) {
    changeProveedor(e.target.value);
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ---------------- MASTER DETAIL ---------------- */

  const openProductPicker = () => {
    if (!form.idproveedor) return showAlert("error", "Primero selecciona un proveedor");
    setProdPage(1);
    setProdSearch("");
    setOpenPicker(true);
  };

  const addProductToItems = (prod) => {
    if (!form.idproveedor) return showAlert("error", "Primero selecciona un proveedor");

    const pProv = getProductoProveedorId(prod);
    if (pProv != null && String(pProv) !== String(form.idproveedor)) {
      showAlert("error", "Ese producto no pertenece al proveedor seleccionado");
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((x) => String(x.idproductos) === String(prod.idproductos));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: Math.max(1, Number(copy[idx].cantidad) + 1) };
        return copy;
      }
      return [...prev, { idproductos: String(prod.idproductos), cantidad: 1 }];
    });

    setOpenPicker(false);
  };

  const updateItemQty = (idproductos, value) => {
    const cant = Number(value);
    if (!Number.isFinite(cant) || cant <= 0) return;
    setItems((prev) =>
      prev.map((it) =>
        String(it.idproductos) === String(idproductos) ? { ...it, cantidad: cant } : it
      )
    );
  };

  const removeItem = (idproductos) => {
    setItems((prev) => prev.filter((it) => String(it.idproductos) !== String(idproductos)));
  };

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const p = getProducto(it.idproductos);
      const precio = Number(p?.precio ?? 0);
      return acc + precio * Number(it.cantidad || 0);
    }, 0);
  }, [items, productos]);

  const viewTotal = useMemo(() => {
    return viewItems.reduce((acc, it) => {
      const p = getProducto(it.idproductos);
      const precio = Number(p?.precio ?? 0);
      return acc + precio * Number(it.cantidad || 0);
    }, 0);
  }, [viewItems, productos]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.idproveedor) return showAlert("error", "Selecciona un proveedor");
    if (!form.fechaPedido) return showAlert("error", "Selecciona una fecha");
    if (items.length === 0) return showAlert("error", "Agrega al menos 1 producto al pedido");

    const payload = {
      idproveedor: Number(form.idproveedor),
      fechaPedido: form.fechaPedido,
      estado: form.estado,
      items: items.map((it) => ({
        idproductos: Number(it.idproductos),
        cantidad: Number(it.cantidad) || 1,
      })),
    };

    try {
      const url = editId ? `${API_PED}/${editId}` : API_PED;
      const method = editId ? "PUT" : "POST";

      const { res, data } = await fetchJson(url, {
        method,
        headers: { ...headersAuth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok && data?.ok) {
        showAlert("exito", editId ? "Pedido actualizado" : "Pedido creado");
        setOpenForm(false);
        resetPedido();
        fetchPedidos();
        loadCombos();
      } else {
        showAlert("error", data?.msg || "Error al guardar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al guardar");
    }
  }

  /* ---------------- Productos (picker) ---------------- */

  const productosPorProveedor = useMemo(() => {
    const provId = String(form.idproveedor || "");
    if (!provId) return [];
    if (!anyProdHasProveedor) return productos;
    return productos.filter((p) => String(getProductoProveedorId(p) ?? "") === provId);
  }, [productos, form.idproveedor, anyProdHasProveedor]);

  const filteredProductos = useMemo(() => {
    const s = prodSearch.toLowerCase().trim();
    if (!s) return productosPorProveedor;
    return productosPorProveedor.filter((p) =>
      `${p.idproductos ?? ""} ${p.nombreproductos ?? ""}`.toLowerCase().includes(s)
    );
  }, [productosPorProveedor, prodSearch]);

  const totalPagesProd = Math.max(1, Math.ceil(filteredProductos.length / PAGE_SIZE));
  const pageProductos = useMemo(() => {
    const start = (prodPage - 1) * PAGE_SIZE;
    return filteredProductos.slice(start, start + PAGE_SIZE);
  }, [filteredProductos, prodPage]);

  useEffect(() => {
    if (prodPage > totalPagesProd) setProdPage(totalPagesProd);
  }, [totalPagesProd, prodPage]);

  /* ---------------- Filtro pedidos ---------------- */

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return pedidos;

    return pedidos.filter((p) => {
      const id = getPedidoId(p);
      const provName = getProveedorNombrePedido(p) || "";
      return `${id} ${provName} ${p.fechaPedido || ""} ${p.estado || ""}`
        .toLowerCase()
        .includes(s);
    });
  }, [pedidos, search, proveedoresMap]);

  /* ---------------- UI ---------------- */

  return (
    <div className="roles-page">
      <header className="header">
        <h1>Pedidos</h1>

        <div className="header-actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              placeholder="Buscar por id, proveedor, fecha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn primary" onClick={fetchPedidos}>
            <span className="material-symbols-rounded">refresh</span>
            Recargar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span>
            Registrar nuevo pedido
          </button>
        </div>
      </header>

      {alerta.mensaje && (
        <div
          className={`alerta ${
            alerta.tipo === "error"
              ? "alerta-error"
              : alerta.tipo === "exito"
              ? "alerta-exito"
              : "alerta-info"
          }`}
        >
          {alerta.mensaje}
        </div>
      )}

      <div className="tables-container">
        <table>
          <thead>
            <tr>
              <th>IDPedido</th>
              <th>Proveedor</th>
              <th>FechaPedido</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  Sin registros
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const id = getPedidoId(p);
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{getProveedorNombrePedido(p) || p.idproveedor}</td>
                    <td>{formatDateDisplay(p.fechaPedido)}</td>

                    <td>
                      <span
                        className={`estado-dot ${
                          p.estado === "Completado" || p.estado === "Completada"
                            ? "estado-aprobado"
                            : p.estado === "Pendiente"
                            ? "estado-pendiente"
                            : "estado-otro"
                        }`}
                      />
                      {p.estado}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button className="btn-edit" onClick={() => onView(id)}>
                          <span className="material-symbols-rounded">visibility</span>
                          Ver detalle
                        </button>

                        <button className="btn-edit" onClick={() => onEdit(id)}>
                          <span className="material-symbols-rounded">edit</span>
                          Editar
                        </button>

                        <button className="btn-delete" onClick={() => askDelete(id)}>
                          <span className="material-symbols-rounded">delete</span>
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
      </div>

      {/* Modal Master-Detail (EDITAR / CREAR) */}
      {openForm && (
        <div
          className="modal show"
          onClick={(e) => e.target.classList.contains("modal") && setOpenForm(false)}
        >
          <div className="modal-dialog" style={{ maxWidth: 980 }}>
            <div className="modal-header">
              <div className="modal-title">
                {editId ? `Editar pedido #${editId}` : "Registrar pedido"}
              </div>
              <button className="close-btn" onClick={() => setOpenForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Proveedor</label>
                  <select
                    name="idproveedor"
                    value={form.idproveedor}
                    onChange={onProveedorChange}
                    required
                  >
                    <option value="">Selecciona un proveedor</option>
                    {proveedores.map((pr) => (
                      <option key={pr.idproveedor} value={pr.idproveedor}>
                        {proveedorNombre(pr) || `Proveedor ${pr.idproveedor}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Fecha de pedido</label>
                  <input
                    type="date"
                    name="fechaPedido"
                    value={form.fechaPedido}
                    onChange={onFormChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Estado del pedido</label>
                  <select name="estado" value={form.estado} onChange={onFormChange}>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="detalle-card-header" style={{ marginTop: 16 }}>
                  <div className="detalle-card-avatar">PR</div>
                  <div className="detalle-card-text">
                    <div className="detalle-card-title">Productos seleccionados</div>
                    <div className="detalle-card-subtitle">
                      Solo aparecen productos del proveedor seleccionado.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn primary"
                    onClick={openProductPicker}
                    disabled={!form.idproveedor}
                  >
                    <span className="material-symbols-rounded">add</span>
                    Agregar producto
                  </button>
                </div>

                {items.length === 0 ? (
                  <p style={{ marginTop: 12 }}>Aún no agregas productos.</p>
                ) : (
                  <div className="detalle-table-wrap" style={{ marginTop: 12 }}>
                    <table className="detalle-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ width: 120 }}>Cantidad</th>
                          <th style={{ width: 130 }}>VL Unit</th>
                          <th style={{ width: 130 }}>Total</th>
                          <th style={{ width: 120 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => {
                          const pr = getProducto(it.idproductos);
                          const precio = Number(pr?.precio ?? 0);
                          const line = precio * Number(it.cantidad || 0);
                          return (
                            <tr key={it.idproductos}>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <strong>
                                    {pr?.nombreproductos || `Producto ${it.idproductos}`}
                                  </strong>
                                  <span style={{ opacity: 0.75, fontSize: 12 }}>
                                    Código: {it.idproductos} · Stock:{" "}
                                    {pr?.cantidadexistente ?? "-"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.cantidad}
                                  onChange={(e) => updateItemQty(it.idproductos, e.target.value)}
                                  style={{ width: 90 }}
                                />
                              </td>

                              <td>${money(precio)}</td>
                              <td>${money(line)}</td>

                              <td>
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => removeItem(it.idproductos)}
                                >
                                  <span className="material-symbols-rounded">delete</span>
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <strong>Total: ${money(total)}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-cancel" onClick={() => setOpenForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary">
                  <span className="material-symbols-rounded">check</span>
                  {editId ? "Actualizar" : "Guardar pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal VER DETALLE */}
      {openView && (
        <div
          className="modal show"
          onClick={(e) => e.target.classList.contains("modal") && setOpenView(false)}
        >
          <div className="modal-dialog" style={{ maxWidth: 980 }}>
            <div className="modal-header">
              <div className="modal-title">Detalle del pedido #{viewId}</div>
              <button className="close-btn" onClick={() => setOpenView(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {viewLoading ? (
                <p>Cargando detalle...</p>
              ) : viewItems.length === 0 ? (
                <p>Este pedido no tiene productos.</p>
              ) : (
                <div className="detalle-table-wrap" style={{ marginTop: 6 }}>
                  <table className="detalle-table">
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>Código</th>
                        <th>Nombre</th>
                        <th style={{ width: 140 }}>Precio</th>
                        <th style={{ width: 120 }}>Cantidad</th>
                        <th style={{ width: 140 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewItems.map((it) => {
                        const pr = getProducto(it.idproductos);
                        const precio = Number(pr?.precio ?? 0);
                        const line = precio * Number(it.cantidad || 0);
                        return (
                          <tr key={it.idproductos}>
                            <td>{it.idproductos}</td>
                            <td>{pr?.nombreproductos || `Producto ${it.idproductos}`}</td>
                            <td>${money(precio)}</td>
                            <td>{it.cantidad}</td>
                            <td>${money(line)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <strong>Total: ${money(viewTotal)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenView(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal listado de productos */}
      {openPicker && (
        <div
          className="modal show"
          onClick={(e) => e.target.classList.contains("modal") && setOpenPicker(false)}
        >
          <div className="modal-dialog" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <div className="modal-title">
                Listado de productos · {getProveedorNombreById(form.idproveedor)}
              </div>
              <button className="close-btn" onClick={() => setOpenPicker(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="search-wrapper" style={{ marginBottom: 12 }}>
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  className="search-input"
                  placeholder="Buscar producto por código o nombre..."
                  value={prodSearch}
                  onChange={(e) => {
                    setProdSearch(e.target.value);
                    setProdPage(1);
                  }}
                />
              </div>

              <div className="detalle-table-wrap">
                <table className="detalle-table">
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Código</th>
                      <th>Nombre</th>
                      <th style={{ width: 140 }}>Precio</th>
                      <th style={{ width: 120 }}>Stock</th>
                      <th style={{ width: 140 }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageProductos.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 18 }}>
                          Sin resultados
                        </td>
                      </tr>
                    ) : (
                      pageProductos.map((p) => (
                        <tr key={p.idproductos}>
                          <td>{p.idproductos}</td>
                          <td>{p.nombreproductos}</td>
                          <td>${money(p.precio)}</td>
                          <td>{p.cantidadexistente}</td>
                          <td>
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => addProductToItems(p)}
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-cancel"
                    disabled={prodPage <= 1}
                    onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>

                  <strong>
                    {prodPage} / {totalPagesProd}
                  </strong>

                  <button
                    type="button"
                    className="btn btn-cancel"
                    disabled={prodPage >= totalPagesProd}
                    onClick={() => setProdPage((p) => Math.min(totalPagesProd, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenPicker(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar pedido */}
      {openDelete && (
        <div
          className="modal show"
          onClick={(e) => e.target.classList.contains("modal") && setOpenDelete(false)}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">Confirmar eliminación de pedido #{deleteId}</div>
              <button className="close-btn" onClick={() => setOpenDelete(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>¿Seguro que deseas eliminar este pedido?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setOpenDelete(false)}>
                Cancelar
              </button>
              <button className="btn btn-delete" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
