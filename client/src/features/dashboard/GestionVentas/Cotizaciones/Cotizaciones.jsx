// client/src/features/dashboard/Gestionventas/Cotizaciones/Cotizaciones.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./cotizaciones.styles.css";

const API_COT = "https://tunik-api.onrender.com/api/cotizaciones";
const API_DET = "https://tunik-api.onrender.com/api/detallecotizaciones";
const API_SERV = "https://tunik-api.onrender.com/api/servicios";
const API_VEH = "https://tunik-api.onrender.com/api/vehiculos";

// Métodos de pago
const API_MP_CANDIDATES = [
  "https://tunik-api.onrender.com/api/metodospago",
];

const EMPTY_FORM = {
  placa: "",
  fecha: "",
  estado: "Pendiente",
  idmpago: "",
};

const ESTADOS = ["Pendiente", "Aprobado", "Cancelado"];

const normalizeEstado = (v) => {
  const s = String(v || "").trim().toLowerCase();
  if (s.startsWith("aprob")) return "Aprobado";
  if (s.startsWith("pend")) return "Pendiente";
  if (s.startsWith("canc")) return "Cancelado";
  return "Pendiente";
};

export default function Cotizaciones() {
  const token = localStorage.getItem("token");
  const headersAuth = useMemo(() => {
    const h = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);

  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [search, setSearch] = useState("");

  // modal crear/editar (master)
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // detalle (items: servicios seleccionados)
  const [items, setItems] = useState([]);

  // modal picker servicios
  const [openPicker, setOpenPicker] = useState(false);
  const [servPage, setServPage] = useState(1);
  const [servSearch, setServSearch] = useState("");
  const PAGE_SIZE = 8;

  // modal eliminar
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
    showAlert._t = window.setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 3200);
  };

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  const extractRows = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.detalle)) return data.detalle;
    if (Array.isArray(data?.detalles)) return data.detalles;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

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

  const money = (n) => Number(n || 0).toLocaleString("es-CO");

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

  const getMetodoId = (m) => m?.idmpago ?? m?.idmetodospago ?? m?.idmetodopago ?? m?.id ?? null;

  const getMetodoNombre = (m) =>
    m?.nombremetodo ?? m?.nombre ?? m?.descripcion ?? m?.metodo ?? `Método #${getMetodoId(m) ?? ""}`;

  const vehLabel = (v) => {
    const placa = v?.placa ?? "";
    const modelo = v?.modelo ?? "";
    const color = v?.color ?? "";
    const extra = [modelo, color].filter(Boolean).join(" · ");
    return extra ? `${placa} · ${extra}` : placa;
  };

  const getServicio = (idservicios) =>
    servicios.find((s) => String(s.idservicios) === String(idservicios)) || null;

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, fecha: new Date().toISOString().slice(0, 10), estado: "Pendiente" });
    setItems([]);
    setEditId(null);
    setServPage(1);
    setServSearch("");
  };

  /* ---------------- Cargar combos ---------------- */

  const loadVehiculos = async () => {
    try {
      const { res, data } = await fetchJson(API_VEH);
      if (res.ok) {
        setVehiculos(extractRows(data?.ok ? data.data : data));
      } else {
        setVehiculos([]);
      }
    } catch {
      setVehiculos([]);
    }
  };

  const loadServicios = async () => {
    try {
      const { res, data } = await fetchJson(API_SERV);
      if (res.ok) setServicios(extractRows(data?.ok ? data.data : data));
      else setServicios([]);
    } catch {
      setServicios([]);
    }
  };

  const loadMetodosPago = async () => {
    try {
      for (const url of API_MP_CANDIDATES) {
        const { res, data } = await fetchJson(url);
        if (!res.ok) continue;

        const list = extractRows(data?.ok ? data.data : data);
        const clean = safeArray(list).filter((x) => getMetodoId(x) != null);

        if (clean.length >= 0) {
          // si viene vacía, seguimos probando otra ruta; si hay datos, nos quedamos con esta
          if (clean.length > 0) {
            setMetodosPago(clean);
            return;
          }
        }
      }
      setMetodosPago([]);
    } catch {
      setMetodosPago([]);
    }
  };

  /* ---------------- Cotizaciones ---------------- */

  async function fetchCotizaciones() {
    setLoading(true);
    try {
      const { res, data } = await fetchJson(API_COT);
      const rows = data?.ok ? safeArray(data.data) : extractRows(data);

      if (res.ok) {
        setCotizaciones(rows);
        if (!rows.length) showAlert("info", data?.msg || "No se encontraron cotizaciones");
      } else {
        setCotizaciones([]);
        showAlert("error", data?.msg || "Error cargando cotizaciones");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error cargando cotizaciones");
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCotizaciones();
    loadVehiculos();
    loadServicios();
    loadMetodosPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Detalle: leer desde API_DET (view/edit) ---------------- */

  const mapDetalleCot = (rows) =>
    safeArray(rows)
      .map((d) => {
        const idservicios = d?.idservicios ?? d?.idservicio ?? d?.servicio_id ?? null;
        if (idservicios == null) return null;

        const nombre = d?.servicio?.nombreservicios ?? d?.nombreservicios ?? "";
        const base = d?.servicio?.preciounitario ?? d?.preciounitario ?? 0;
        const preciochange = d?.preciochange ?? base ?? 0;

        return {
          idservicios: String(idservicios),
          nombreservicios: nombre || (getServicio(idservicios)?.nombreservicios ?? `Servicio ${idservicios}`),
          preciounitario: Number(base || 0),
          preciochange: String(preciochange ?? 0),
        };
      })
      .filter(Boolean);

  async function fetchDetalleCotizacion(idcotizaciones) {
    try {
      const { res, data } = await fetchJson(`${API_DET}/cotizacion/${idcotizaciones}`);
      if (!res.ok) return [];
      const rows = data?.ok ? safeArray(data.data) : extractRows(data);
      return mapDetalleCot(rows);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /* ---------------- CRUD cotización ---------------- */

  function onNew() {
    resetForm();
    setOpenForm(true);
  }

  async function onEdit(c) {
    const id = c?.idcotizaciones ?? c?.id ?? null;
    if (!id) return showAlert("error", "ID inválido");

    setEditId(id);

    const idMetodo =
      c?.idmpago ?? c?.metodoPago?.idmpago ?? c?.idmetodospago ?? c?.idmetodopago ?? "";

    setForm({
      placa: String(c?.placa ?? ""),
      fecha: formatDateInput(c?.fecha),
      estado: normalizeEstado(c?.estado),
      idmpago: idMetodo ? String(idMetodo) : "",
    });

    // precargar detalle para editar
    const det = await fetchDetalleCotizacion(id);
    setItems(det);

    setServPage(1);
    setServSearch("");
    setOpenForm(true);
  }

  async function onView(c) {
    const id = c?.idcotizaciones ?? c?.id ?? null;
    if (!id) return;

    setViewLoading(true);
    setViewId(id);
    setViewItems([]);
    try {
      const det = await fetchDetalleCotizacion(id);
      setViewItems(det);
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
      const { res, data } = await fetchJson(`${API_COT}/${deleteId}`, { method: "DELETE" });

      if (res.ok && data?.ok) {
        showAlert("exito", data?.msg || "Cotización eliminada correctamente");
        setOpenDelete(false);
        setDeleteId(null);
        fetchCotizaciones();
      } else {
        showAlert("error", data?.msg || "No se pudo eliminar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al eliminar");
    }
  }

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ---------------- MASTER DETAIL (servicios) ---------------- */

  const openServicePicker = () => {
    setServPage(1);
    setServSearch("");
    setOpenPicker(true);
  };

  const addServiceToItems = (serv) => {
    setItems((prev) => {
      const id = String(serv.idservicios);
      const idx = prev.findIndex((x) => String(x.idservicios) === id);
      if (idx >= 0) return prev; // ya está
      return [
        ...prev,
        {
          idservicios: id,
          nombreservicios: serv.nombreservicios,
          preciounitario: Number(serv.preciounitario || 0),
          preciochange: String(serv.preciounitario ?? 0),
        },
      ];
    });
    setOpenPicker(false);
  };

  const updateItemPrice = (idservicios, value) => {
    setItems((prev) =>
      prev.map((it) =>
        String(it.idservicios) === String(idservicios) ? { ...it, preciochange: value } : it
      )
    );
  };

  const removeItem = (idservicios) => {
    setItems((prev) => prev.filter((it) => String(it.idservicios) !== String(idservicios)));
  };

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.preciochange || 0), 0);
  }, [items]);

  const viewTotal = useMemo(() => {
    return viewItems.reduce((acc, it) => acc + Number(it.preciochange || 0), 0);
  }, [viewItems]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.placa) return showAlert("error", "Selecciona una placa");
    if (!form.fecha) return showAlert("error", "Selecciona una fecha");
    if (!form.idmpago) return showAlert("error", "Selecciona un método de pago");
    if (items.length === 0) return showAlert("error", "Agrega al menos 1 servicio a la cotización");

    const payload = {
      placa: form.placa,
      fecha: form.fecha,
      estado: normalizeEstado(form.estado),
      idmpago: Number(form.idmpago),
      // compat
      idmetodospago: Number(form.idmpago),
      items: items.map((it) => ({
        idservicios: Number(it.idservicios),
        preciochange: Number(it.preciochange || 0),
      })),
    };

    try {
      const url = editId ? `${API_COT}/${editId}` : API_COT;
      const method = editId ? "PUT" : "POST";

      const { res, data } = await fetchJson(url, {
        method,
        headers: { ...headersAuth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok && data?.ok) {
        showAlert("exito", editId ? "Cotización actualizada" : "Cotización creada");
        setOpenForm(false);
        resetForm();
        fetchCotizaciones();
      } else {
        showAlert("error", data?.msg || "Error al guardar");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al guardar");
    }
  }

  /* ---------------- Servicios (picker) ---------------- */

  const filteredServicios = useMemo(() => {
    const s = servSearch.toLowerCase().trim();
    if (!s) return servicios;
    return servicios.filter((p) =>
      `${p.idservicios ?? ""} ${p.nombreservicios ?? ""}`.toLowerCase().includes(s)
    );
  }, [servicios, servSearch]);

  const totalPagesServ = Math.max(1, Math.ceil(filteredServicios.length / PAGE_SIZE));
  const pageServicios = useMemo(() => {
    const start = (servPage - 1) * PAGE_SIZE;
    return filteredServicios.slice(start, start + PAGE_SIZE);
  }, [filteredServicios, servPage]);

  useEffect(() => {
    if (servPage > totalPagesServ) setServPage(totalPagesServ);
  }, [totalPagesServ, servPage]);

  /* ---------------- Filtro tabla ---------------- */

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return cotizaciones;

    return cotizaciones.filter((c) => {
      const id = c?.idcotizaciones ?? c?.id ?? "";
      const mp = c?.metodoPago?.nombremetodo ?? "";
      return `${id} ${c?.placa ?? ""} ${c?.fecha ?? ""} ${c?.estado ?? ""} ${mp}`
        .toLowerCase()
        .includes(s);
    });
  }, [cotizaciones, search]);

  /* ---------------- UI ---------------- */

  return (
    <div className="roles-page">
      <header className="header">
        <h1>Cotizaciones</h1>

        <div className="header-actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              className="search-input"
              placeholder="Buscar por id, placa, fecha, estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn primary" onClick={fetchCotizaciones}>
            <span className="material-symbols-rounded">refresh</span>
            Recargar
          </button>

          <button className="btn primary" onClick={onNew}>
            <span className="material-symbols-rounded">add</span>
            Registrar nueva cotización
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
              <th>ID</th>
              <th>Placa</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Método pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Sin registros
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const id = c?.idcotizaciones ?? c?.id;
                const estado = normalizeEstado(c?.estado);
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{c?.placa}</td>
                    <td>{formatDateDisplay(c?.fecha)}</td>
                    <td>${money(c?.total ?? 0)}</td>
                    <td>{c?.metodoPago?.nombremetodo ?? "-"}</td>

                    <td>
                      <span
                        className={`estado-dot ${
                          estado === "Aprobado"
                            ? "estado-aprobado"
                            : estado === "Pendiente"
                            ? "estado-pendiente"
                            : "estado-otro"
                        }`}
                      />
                      {estado}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button className="btn-edit" onClick={() => onView(c)}>
                          <span className="material-symbols-rounded">visibility</span>
                          Ver detalle
                        </button>

                        <button className="btn-edit" onClick={() => onEdit(c)}>
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

      {/* Modal Master-Detail (CREAR / EDITAR) */}
      {openForm && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenForm(false)}>
          <div className="modal-dialog" style={{ maxWidth: 980 }}>
            <div className="modal-header">
              <div className="modal-title">
                {editId ? `Editar cotización #${editId}` : "Registrar cotización"}
              </div>
              <button className="close-btn" onClick={() => setOpenForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <label>Placa</label>
                  <select name="placa" value={form.placa} onChange={onFormChange} required>
                    <option value="">Selecciona una placa</option>
                    {vehiculos.map((v) => (
                      <option key={v.placa} value={v.placa}>
                        {vehLabel(v)}
                      </option>
                    ))}
                  </select>
                  {vehiculos.length === 0 && (
                    <small style={{ display: "block", marginTop: 6, opacity: 0.8 }}>
                      No se cargaron vehículos. Revisa /api/vehiculos y permisos.
                    </small>
                  )}
                </div>

                <div className="form-row">
                  <label>Fecha</label>
                  <input type="date" name="fecha" value={form.fecha} onChange={onFormChange} required />
                </div>

                <div className="form-row">
                  <label>Estado</label>
                  <select name="estado" value={form.estado} onChange={onFormChange}>
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Método de pago</label>
                  <select name="idmpago" value={form.idmpago} onChange={onFormChange} required>
                    <option value="">Selecciona un método</option>
                    {metodosPago.map((m) => {
                      const id = getMetodoId(m);
                      if (!id) return null;
                      return (
                        <option key={id} value={id}>
                          {getMetodoNombre(m)}
                        </option>
                      );
                    })}
                  </select>
                  {metodosPago.length === 0 && (
                    <small style={{ display: "block", marginTop: 6, opacity: 0.8 }}>
                      No se cargaron métodos de pago. Revisa /api/metodospago y permisos.
                    </small>
                  )}
                </div>

                {/* Card header detalle (igual estilo pedidos) */}
                <div className="detalle-card-header" style={{ marginTop: 16 }}>
                  <div className="detalle-card-avatar">SV</div>
                  <div className="detalle-card-text">
                    <div className="detalle-card-title">Servicios seleccionados</div>
                    <div className="detalle-card-subtitle">
                      Agrega servicios y ajusta el precio de la cotización si aplica.
                    </div>
                  </div>

                  <button type="button" className="btn primary" onClick={openServicePicker}>
                    <span className="material-symbols-rounded">add</span>
                    Agregar servicio
                  </button>
                </div>

                {items.length === 0 ? (
                  <p style={{ marginTop: 12 }}>Aún no agregas servicios.</p>
                ) : (
                  <div className="detalle-table-wrap" style={{ marginTop: 12 }}>
                    <table className="detalle-table">
                      <thead>
                        <tr>
                          <th>Servicio</th>
                          <th style={{ width: 150 }}>VL Base</th>
                          <th style={{ width: 160 }}>VL Cotización</th>
                          <th style={{ width: 120 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => {
                          const base = Number(it.preciounitario || 0);
                          return (
                            <tr key={it.idservicios}>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  <strong>{it.nombreservicios}</strong>
                                  <span style={{ opacity: 0.75, fontSize: 12 }}>
                                    Código: {it.idservicios}
                                  </span>
                                </div>
                              </td>

                              <td>${money(base)}</td>

                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.preciochange}
                                  onChange={(e) => updateItemPrice(it.idservicios, e.target.value)}
                                  style={{ width: 120 }}
                                />
                              </td>

                              <td>
                                <button type="button" className="btn-delete" onClick={() => removeItem(it.idservicios)}>
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
                  {editId ? "Actualizar" : "Guardar cotización"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal VER DETALLE */}
      {openView && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenView(false)}>
          <div className="modal-dialog" style={{ maxWidth: 980 }}>
            <div className="modal-header">
              <div className="modal-title">Detalle de la cotización #{viewId}</div>
              <button className="close-btn" onClick={() => setOpenView(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {viewLoading ? (
                <p>Cargando detalle...</p>
              ) : viewItems.length === 0 ? (
                <p>Esta cotización no tiene servicios.</p>
              ) : (
                <div className="detalle-table-wrap" style={{ marginTop: 6 }}>
                  <table className="detalle-table">
                    <thead>
                      <tr>
                        <th style={{ width: 140 }}>Código</th>
                        <th>Servicio</th>
                        <th style={{ width: 160 }}>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewItems.map((it) => (
                        <tr key={it.idservicios}>
                          <td>{it.idservicios}</td>
                          <td>{it.nombreservicios}</td>
                          <td>${money(it.preciochange)}</td>
                        </tr>
                      ))}
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

      {/* Modal listado de servicios (picker) — ✅ sin scroll incómodo */}
      {openPicker && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenPicker(false)}>
          <div className="modal-dialog" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <div className="modal-title">Listado de servicios</div>
              <button className="close-btn" onClick={() => setOpenPicker(false)}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ overflow: "hidden" }}>
              <div className="search-wrapper" style={{ marginBottom: 12 }}>
                <span className="material-symbols-rounded search-icon">search</span>
                <input
                  className="search-input"
                  placeholder="Buscar servicio por código o nombre..."
                  value={servSearch}
                  onChange={(e) => {
                    setServSearch(e.target.value);
                    setServPage(1);
                  }}
                />
              </div>

              {/* ✅ Un solo scroll: SOLO la tabla si hace falta */}
              <div className="detalle-table-wrap" style={{ maxHeight: 520, overflowY: "auto" }}>
                <table className="detalle-table">
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Código</th>
                      <th>Nombre</th>
                      <th style={{ width: 160 }}>Precio base</th>
                      <th style={{ width: 160 }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageServicios.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: 18 }}>
                          Sin resultados
                        </td>
                      </tr>
                    ) : (
                      pageServicios.map((s) => {
                        const ya = items.some((it) => String(it.idservicios) === String(s.idservicios));
                        return (
                          <tr key={s.idservicios}>
                            <td>{s.idservicios}</td>
                            <td>{s.nombreservicios}</td>
                            <td>${money(s.preciounitario)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn primary"
                                disabled={ya}
                                onClick={() => addServiceToItems(s)}
                              >
                                {ya ? "Seleccionado" : "Seleccionar"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-cancel"
                  disabled={servPage <= 1}
                  onClick={() => setServPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>

                <strong>
                  {servPage} / {totalPagesServ}
                </strong>

                <button
                  type="button"
                  className="btn btn-cancel"
                  disabled={servPage >= totalPagesServ}
                  onClick={() => setServPage((p) => Math.min(totalPagesServ, p + 1))}
                >
                  Siguiente
                </button>
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

      {/* Modal eliminar */}
      {openDelete && (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenDelete(false)}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">Confirmar eliminación de cotización #{deleteId}</div>
              <button className="close-btn" onClick={() => setOpenDelete(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>¿Seguro que deseas eliminar esta cotización?</p>
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
