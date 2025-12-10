import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import HeaderCliente from "../../Components/cliente/HeaderCliente";
import FooterCliente from "../../Components/cliente/FooterCliente";
import "./vehiculosCliente.css";

const API = "http://localhost:3000/api";
const VEH_URL = `${API}/vehiculos`;
const TIPOS_URL = `${API}/tipovehiculos`;
const MARCAS_URL = `${API}/marcas`;

function safeUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function getNumeroDocumento(usuario) {
  return (
    usuario?.numero_documento ??
    usuario?.numeroDocumento ??
    usuario?.documento ??
    usuario?.cedula ??
    ""
  );
}

function normalizePlaca(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").trim();
}

function isModeloValido(v) {
  return /^\d{4}$/.test(String(v || "").trim());
}

function isColorValido(v) {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(String(v || "").trim());
}

// Carro/Camioneta: ABC123
const PLACA_CARRO = /^[A-Z]{3}\d{3}$/;
// Moto: ABC12D
const PLACA_MOTO = /^[A-Z]{3}\d{2}[A-Z]$/;

export default function VehiculosCliente() {
  const usuario = useMemo(() => safeUser(), []);
  const numero_documento = useMemo(
    () => String(getNumeroDocumento(usuario) || ""),
    [usuario]
  );

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const [misVehiculos, setMisVehiculos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [form, setForm] = useState({
    placa: "",
    modelo: "",
    color: "",
    idtipovehiculos: "",
    idmarca: "",
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");

  const tipoSeleccionado = useMemo(() => {
    const t = (tipos || []).find(
      (x) => String(x.idtipovehiculos) === String(form.idtipovehiculos)
    );
    return t || null;
  }, [tipos, form.idtipovehiculos]);

  const placaRegex = useMemo(() => {
    const nombre = String(tipoSeleccionado?.nombre || "").toLowerCase();
    return nombre.includes("moto") ? PLACA_MOTO : PLACA_CARRO;
  }, [tipoSeleccionado]);

  async function fetchAll() {
    setLoading(true);
    setError("");
    setOkMsg("");

    if (!numero_documento) {
      setLoading(false);
      setMisVehiculos([]);
      setError("No autenticado (no se pudo leer el usuario logueado).");
      return;
    }

    try {
      const [vehRes, tRes, mRes] = await Promise.all([
        axios.get(VEH_URL, { params: { numero_documento }, headers }),
        axios.get(TIPOS_URL, { headers }),
        axios.get(MARCAS_URL, { headers }),
      ]);

      setMisVehiculos(vehRes?.data?.data || []);
      setTipos(tRes?.data?.data || tRes?.data || []);
      setMarcas(mRes?.data?.data || mRes?.data || []);
    } catch (e) {
      console.error(e);
      setMisVehiculos([]);
      setTipos([]);
      setMarcas([]);
      setError(e?.response?.data?.msg || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function resetForm() {
    setForm({
      placa: "",
      modelo: "",
      color: "",
      idtipovehiculos: "",
      idmarca: "",
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!numero_documento) {
      setError("No autenticado (no se pudo leer el usuario logueado).");
      return;
    }

    const placa = normalizePlaca(form.placa);
    const modelo = String(form.modelo || "").trim();
    const color = String(form.color || "").trim();
    const idtipovehiculos = Number(form.idtipovehiculos);
    const idmarca = Number(form.idmarca);

    if (!idtipovehiculos) return setError("Selecciona el tipo de vehículo.");
    if (!placaRegex.test(placa)) {
      const nombre = String(tipoSeleccionado?.nombre || "").toLowerCase();
      return setError(
        nombre.includes("moto")
          ? "Para moto debe ser ABC12D (3 letras + 2 números + 1 letra)."
          : "Para carro/camioneta debe ser ABC123 (3 letras + 3 números)."
      );
    }
    if (!isModeloValido(modelo))
      return setError("El modelo debe tener exactamente 4 dígitos (Ej: 2022).");
    if (!isColorValido(color))
      return setError("El color solo puede contener letras y espacios.");
    if (!idmarca) return setError("Selecciona la marca.");

    const payload = {
      placa,
      modelo,
      color,
      idtipovehiculos,
      idmarca,
      numero_documento,
    };

    try {
      setSending(true);
      const { data } = await axios.post(VEH_URL, payload, { headers });

      if (!data?.ok)
        throw new Error(data?.msg || "No se pudo registrar el vehículo.");

      setOkMsg(
        "Vehículo registrado correctamente. Ya aparecerá en Agendar cita."
      );
      resetForm();
      fetchAll();
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.msg || e.message || "Error registrando vehículo."
      );
    } finally {
      setSending(false);
    }
  }

  async function eliminar(placa) {
    setError("");
    setOkMsg("");
    try {
      const { data } = await axios.delete(
        `${VEH_URL}/${encodeURIComponent(placa)}`,
        { headers }
      );
      if (!data?.ok) throw new Error(data?.msg || "No se pudo eliminar.");
      setOkMsg("Vehículo eliminado.");
      fetchAll();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.msg || e.message || "Error eliminando vehículo.");
    }
  }

  return (
    <div className="citas-page">
      <HeaderCliente />

      <div className="container py-5">
        <div className="citas-head">
          <div>
            <h2>Mis Vehículos</h2>
            <p className="text-muted mb-0">
              Registra tu vehículo para poder agendar citas más rápido.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchAll}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {okMsg ? <div className="alert alert-success mt-3">{okMsg}</div> : null}
        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

        <div className="citas-card">
          <h5 className="mb-1 fw-bold">Registrar vehículo</h5>
          <p className="text-muted mb-4">
            Se asociará automáticamente a tu cuenta ({usuario?.nombre || "Cliente"}).
          </p>

          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label">Placa</label>
                <input
                  className="form-control"
                  name="placa"
                  value={form.placa}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, placa: normalizePlaca(e.target.value) }))
                  }
                  placeholder="ABC123"
                  maxLength={10}
                  required
                />
                <div className="form-text">
                  {String(tipoSeleccionado?.nombre || "").toLowerCase().includes("moto")
                    ? "Formato moto: ABC12D"
                    : "Formato carro: ABC123"}
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Modelo</label>
                <input
                  className="form-control"
                  name="modelo"
                  value={form.modelo}
                  onChange={onChange}
                  placeholder="2022"
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Color</label>
                <input
                  className="form-control"
                  name="color"
                  value={form.color}
                  onChange={onChange}
                  placeholder="Rojo"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Tipo de vehículo</label>
                <select
                  className="form-select"
                  name="idtipovehiculos"
                  value={form.idtipovehiculos}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona...</option>
                  {(tipos || []).map((t) => (
                    <option key={t.idtipovehiculos} value={t.idtipovehiculos}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Marca</label>
                <select
                  className="form-select"
                  name="idmarca"
                  value={form.idmarca}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona...</option>
                  {(marcas || []).map((m) => (
                    <option key={m.idmarca} value={m.idmarca}>
                      {m.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={sending}>
              {sending ? "Guardando..." : "Registrar vehículo"}
            </button>

            <div className="text-muted small mt-2">
              Luego ve a <strong>Agendar cita</strong> y tu placa aparecerá en la lista.
            </div>
          </form>
        </div>

        <div className="citas-card">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="mb-1 fw-bold">Vehículos registrados</h5>
              <p className="text-muted mb-0">Estos son los vehículos asociados a tu cuenta.</p>
            </div>
            <span className="veh-count">{(misVehiculos || []).length} total</span>
          </div>

          <div className="table-responsive mt-3">
            <table className="table align-middle veh-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Color</th>
                  <th>Tipo</th>
                  <th>Marca</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {!loading && (misVehiculos || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Aún no tienes vehículos registrados.
                    </td>
                  </tr>
                ) : (
                  (misVehiculos || []).map((v) => (
                    <tr key={v.placa}>
                      <td className="fw-bold">{v.placa}</td>
                      <td>{v.modelo}</td>
                      <td>{v.color}</td>
                      <td>{v.tipo?.nombre || v.idtipovehiculos}</td>
                      <td>{v.marca?.descripcion || v.idmarca}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm veh-del"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el vehículo ${v.placa}?`)) eliminar(v.placa);
                          }}
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
        </div>
      </div>

      <FooterCliente />
    </div>
  );
}
