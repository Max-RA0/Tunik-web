import React, { useEffect, useMemo, useState } from "react";
import "./detallecotizaciones.styles.css";

const API_DET = "https://tunik-api.onrender.com/api/detallecotizaciones";
const API_COT = "https://tunik-api.onrender.com/api/cotizaciones";
const API_SERV = "https://tunik-api.onrender.com/api/servicios";

export default function DetalleCotizaciones() {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState({ tipo: "", mensaje: "" });
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const token = localStorage.getItem("token");

  // --- datos auxiliares para el formulario ---
  const [cotizaciones, setCotizaciones] = useState([]);
  const [servicios, setServicios] = useState([]);

  // modal add/edit
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null); // {idcotizaciones, idservicios}
  const [form, setForm] = useState({
    idcotizaciones: "",
    idservicios: "",
    preciochange: "",
  });

  // modal delete
  const [showDelete, setShowDelete] = useState(false);
  const [detalleDelete, setDetalleDelete] = useState(null);

  const showAlert = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta({ tipo: "", mensaje: "" }), 3000);
  };

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return n.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
  };

  // ---------- Fetch básicos ----------
  const fetchDetalles = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_DET}?cotizacion=${encodeURIComponent(search)}`
        : API_DET;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data?.ok) {
        setDetalles(data.data || []);
      } else {
        setDetalles([]);
        showAlert(
          "info",
          data?.msg || "No se encontraron detalles de cotizaciones"
        );
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Error al cargar detalles de cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch(API_COT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) setCotizaciones(data.data || []);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error cargando cotizaciones");
    }
  };

  const fetchServicios = async () => {
    try {
      const res = await fetch(API_SERV, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) setServicios(data.data || []);
    } catch (err) {
      console.error(err);
      showAlert("error", "Error cargando servicios");
    }
  };

  useEffect(() => {
    fetchDetalles();
    fetchCotizaciones();
    fetchServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filtro + paginación en front ----------
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return detalles;

    return detalles.filter((d) =>
      `${d.idcotizaciones} ${d.idservicios} ${
        d.servicio?.nombreservicios || ""
      }`
        .toLowerCase()
        .includes(s)
    );
  }, [detalles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  // ---------- Modal crear / editar ----------
  const abrirNuevo = () => {
    setEditando(null);
    setForm({
      idcotizaciones: "",
      idservicios: "",
      preciochange: "",
    });
    setShowModal(true);
  };

  const abrirEditar = (detalle) => {
    setEditando(detalle); // guardamos todo el objeto
    setForm({
      idcotizaciones: detalle.idcotizaciones,
      idservicios: detalle.idservicios,
      preciochange: detalle.preciochange,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm({
      idcotizaciones: "",
      idservicios: "",
      preciochange: "",
    });
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!form.idcotizaciones || !form.idservicios) {
      showAlert("error", "Selecciona cotización y servicio");
      return;
    }

    const payload = {
      idcotizaciones: Number(form.idcotizaciones),
      idservicios: Number(form.idservicios),
      preciochange: form.preciochange,
    };

    try {
      if (!editando) {
        // Crear
        const res = await fetch(API_DET, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.ok) {
          showAlert("error", data.msg || "Error creando detalle");
          return;
        }

        const serv = servicios.find(
          (s) => Number(s.idservicios) === Number(payload.idservicios)
        );

        const nuevaFila = {
          idcotizaciones: payload.idcotizaciones,
          idservicios: payload.idservicios,
          preciochange:
            payload.preciochange || serv?.preciounitario || 0,
          servicio: serv
            ? {
                idservicios: serv.idservicios,
                nombreservicios: serv.nombreservicios,
                preciounitario: serv.preciounitario,
              }
            : null,
        };

        setDetalles((prev) => [...prev, nuevaFila]);
        showAlert("exito", "Detalle registrado correctamente");
      } else {
        // Editar SOLO precio (la PK no se cambia)
        const res = await fetch(
          `${API_DET}/cotizacion/${editando.idcotizaciones}/servicio/${editando.idservicios}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preciochange: payload.preciochange }),
          }
        );
        const data = await res.json();
        if (!data.ok) {
          showAlert("error", data.msg || "Error actualizando detalle");
          return;
        }

        setDetalles((prev) =>
          prev.map((d) =>
            d.idcotizaciones === editando.idcotizaciones &&
            d.idservicios === editando.idservicios
              ? { ...d, preciochange: payload.preciochange }
              : d
          )
        );
        showAlert("exito", "Detalle actualizado correctamente");
      }

      cerrarModal();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error guardando detalle");
    }
  };

  // ---------- Modal eliminar ----------
  const abrirDelete = (detalle) => {
    setDetalleDelete(detalle);
    setShowDelete(true);
  };

  const cerrarDelete = () => {
    setShowDelete(false);
    setDetalleDelete(null);
  };

  const confirmarDelete = async () => {
    if (!detalleDelete) return;

    try {
      const res = await fetch(
        `${API_DET}/cotizacion/${detalleDelete.idcotizaciones}/servicio/${detalleDelete.idservicios}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!data.ok) {
        showAlert("error", data.msg || "Error eliminando detalle");
        return;
      }

      setDetalles((prev) =>
        prev.filter(
          (d) =>
            !(
              d.idcotizaciones === detalleDelete.idcotizaciones &&
              d.idservicios === detalleDelete.idservicios
            )
        )
      );
      showAlert("exito", "Detalle eliminado correctamente");
      cerrarDelete();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error eliminando detalle");
    }
  };

  return (
    <div className="roles-page">
      <header className="header">
        <h1>Detalle de Cotizaciones</h1>
        <div className="header-actions">
          <div className="search-wrapper">
            <span className="material-symbols-rounded search-icon">
              search
            </span>
            <input
              className="search-input"
              placeholder="Buscar por id, servicio o cotización..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <button className="btn primary" onClick={fetchDetalles}>
            <span className="material-symbols-rounded">refresh</span>
            Recargar
          </button>

          <button className="btn primary" type="button" onClick={abrirNuevo}>
            <span className="material-symbols-rounded">add</span>
            Registrar detalle
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
              <th>ID Detalle</th>
              <th>ID Cotización</th>
              <th>ID Servicio</th>
              <th>Nombre Servicio</th>
              <th>Precio por servicio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                  Sin registros
                </td>
              </tr>
            ) : (
              pageItems.map((d, idx) => (
                <tr
                  key={`${d.idcotizaciones}-${d.idservicios}-${idx}`}
                >
                  <td>{(page - 1) * pageSize + idx + 1}</td>
                  <td>{d.idcotizaciones}</td>
                  <td>{d.idservicios}</td>
                  <td>{d.servicio?.nombreservicios || "—"}</td>
                  <td>
                    {formatMoney(
                      d.preciochange ?? d.servicio?.preciounitario ?? 0
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => abrirEditar(d)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => abrirDelete(d)}
                      >
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-bar">
            <button
              className="page-btn"
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
            >
              {"<"}
            </button>
            <span className="page-btn active">{page}</span>
            <button
              className="page-btn"
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages}
            >
              {">"}
            </button>
          </div>
        </div>
      )}

      {/* -------- MODAL CREAR / EDITAR -------- */}
      {showModal && (
        <div
          className="modal show"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) cerrarModal();
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">
                {editando
                  ? "Editar detalle de cotización"
                  : "Registrar detalle de cotización"}
              </div>
              <button
                className="close-btn"
                type="button"
                onClick={cerrarModal}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmitForm}>
                <div className="modal-body">
                  <div>
                    <label>Cotización</label>
                    <select
                      name="idcotizaciones"
                      value={form.idcotizaciones}
                      onChange={handleChangeForm}
                      disabled={!!editando} /* en edición no cambiamos PK */
                    >
                      <option value="">Selecciona una cotización</option>
                      {cotizaciones.map((c) => (
                        <option key={c.idcotizaciones} value={c.idcotizaciones}>
                          #{c.idcotizaciones} - {c.placa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Servicio</label>
                    <select
                      name="idservicios"
                      value={form.idservicios}
                      onChange={handleChangeForm}
                      disabled={!!editando} /* no cambiamos PK */
                    >
                      <option value="">Selecciona un servicio</option>
                      {servicios.map((s) => (
                        <option key={s.idservicios} value={s.idservicios}>
                          {s.nombreservicios}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Precio</label>
                    <input
                      type="number"
                      name="preciochange"
                      min="0"
                      value={form.preciochange}
                      onChange={handleChangeForm}
                      placeholder="Si lo dejas vacío usa el precio del servicio"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn primary">
                    {editando ? "Guardar cambios" : "Registrar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* -------- MODAL ELIMINAR -------- */}
      {showDelete && (
        <div
          className="modal show"
          onClick={(e) => {
            if (e.target.classList.contains("modal")) cerrarDelete();
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title">Eliminar detalle</div>
              <button
                className="close-btn"
                type="button"
                onClick={cerrarDelete}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Seguro que deseas eliminar el detalle del servicio{" "}
                <strong>
                  {detalleDelete?.servicio?.nombreservicios || "este servicio"}
                </strong>{" "}
                de la cotización #{detalleDelete?.idcotizaciones}?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={cerrarDelete}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-delete"
                onClick={confirmarDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
