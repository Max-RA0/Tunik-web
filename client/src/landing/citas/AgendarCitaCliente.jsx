import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import HeaderCliente from "../../Components/cliente/HeaderCliente";
import FooterCliente from "../../Components/cliente/FooterCliente";
import "./citasCliente.css";

const API = "http://localhost:3000/api";
const VEH_URL = `${API}/vehiculos`;
const CIT_URL = `${API}/agendacitas`;

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

// Convierte "2025-12-05T13:40" -> "2025-12-05 13:40:00"
function toMysqlDatetime(dtLocal) {
  if (!dtLocal) return "";
  const s = String(dtLocal);
  return s.includes("T") ? `${s.replace("T", " ")}:00` : s;
}

function fmtDateTime(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function badgeClass(estado) {
  const s = String(estado || "").toLowerCase();
  if (s.includes("agend")) return "text-bg-primary";
  if (s.includes("pend")) return "text-bg-warning";
  if (s.includes("apro") || s.includes("conf") || s.includes("complet"))
    return "text-bg-success";
  if (s.includes("canc") || s.includes("rech")) return "text-bg-danger";
  return "text-bg-secondary";
}

export default function AgendarCitaCliente() {
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

  const [vehiculos, setVehiculos] = useState([]);
  const [citasRecientes, setCitasRecientes] = useState([]);

  const [placa, setPlaca] = useState("");
  const [fecha, setFecha] = useState("");

  const [loadingVeh, setLoadingVeh] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [sending, setSending] = useState(false);

  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");

  async function loadVehiculos() {
    setLoadingVeh(true);
    setError("");

    if (!numero_documento) {
      setLoadingVeh(false);
      setVehiculos([]);
      setError("No se encontró el usuario logueado (número de documento).");
      return;
    }

    try {
      const { data } = await axios.get(VEH_URL, {
        params: { numero_documento },
        headers,
      });

      const list = data?.data || data || [];
      setVehiculos(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setVehiculos([]);
      setError(e?.response?.data?.msg || "No se pudieron cargar tus vehículos.");
    } finally {
      setLoadingVeh(false);
    }
  }

  async function loadCitasRecientes() {
    setLoadingCitas(true);

    if (!numero_documento) {
      setLoadingCitas(false);
      setCitasRecientes([]);
      return;
    }

    try {
      const { data } = await axios.get(CIT_URL, {
        params: { numero_documento },
        headers,
      });

      const list = data?.data || data || [];
      const rows = Array.isArray(list) ? list : [];
      rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setCitasRecientes(rows.slice(0, 5));
    } catch (e) {
      console.error(e);
      setCitasRecientes([]);
      // no ponemos error duro acá para no “ensuciar” el agendamiento
    } finally {
      setLoadingCitas(false);
    }
  }

  async function fetchAll() {
    setOkMsg("");
    setError("");
    await Promise.all([loadVehiculos(), loadCitasRecientes()]);
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero_documento]);

  async function onSubmit(e) {
    e.preventDefault();
    setOkMsg("");
    setError("");

    if (!placa) return setError("Selecciona una placa.");
    if (!fecha) return setError("Selecciona la fecha y hora.");

    try {
      setSending(true);

      const payload = {
        placa,
        fecha: toMysqlDatetime(fecha),
        estado: "Agendada",
        // idcotizaciones ya no se envía 🚫
      };

      const { data } = await axios.post(CIT_URL, payload, { headers });

      if (data?.ok === false) throw new Error(data?.msg || "No se pudo agendar.");

      setOkMsg("¡Cita agendada correctamente!");
      setPlaca("");
      setFecha("");

      // refresca recientes
      await loadCitasRecientes();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.msg || err.message || "Error agendando la cita.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="citas-page">
      <HeaderCliente />

      <div className="container py-5">
        <div className="citas-head">
          <div>
            <h2>Agendar cita</h2>
            <p className="text-muted mb-0">
              Selecciona tu vehículo y la fecha y hora de atención.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchAll}
            disabled={loadingVeh || loadingCitas}
          >
            {loadingVeh || loadingCitas ? "Cargando..." : "Recargar"}
          </button>
        </div>

        {okMsg ? <div className="alert alert-success mt-3">{okMsg}</div> : null}
        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

        {/* CARD 1: Formulario (mismo estilo de Vehículos) */}
        <div className="citas-card">
          <h5 className="mb-1 fw-bold">Agendar una cita</h5>
          <p className="text-muted mb-4">
            Se asociará automáticamente a tu cuenta ({usuario?.nombre || "Cliente"}).
          </p>

          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Vehículo (placa)</label>
                <select
                  className="form-select"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  disabled={loadingVeh}
                  required
                >
                  <option value="">
                    {loadingVeh ? "Cargando vehículos..." : "Selecciona una placa"}
                  </option>
                  {vehiculos.map((v) => (
                    <option key={v.placa} value={v.placa}>
                      {v.placa} — {v.color} {v.modelo}
                    </option>
                  ))}
                </select>

                <div className="form-text">
                  Si no aparece tu placa, ve a <strong>Mis Vehículos</strong> y registra uno.
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Fecha y hora</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary w-100 mt-4" disabled={sending}>
              {sending ? "Agendando..." : "Agendar cita"}
            </button>

            <div className="text-muted small mt-2">
              Luego podrás ver el estado en <strong>Historial de citas</strong>.
            </div>
          </form>
        </div>

        {/* CARD 2: Mis citas recientes (como “Vehículos registrados”) */}
        <div className="citas-card">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="mb-1 fw-bold">Mis citas recientes</h5>
              <p className="text-muted mb-0">Últimas 5 citas de tu historial.</p>
            </div>
            <span className="veh-count">{(citasRecientes || []).length} mostradas</span>
          </div>

          <div className="table-responsive mt-3">
            <table className="table align-middle veh-table mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Placa</th>
                  <th>ID Cotización</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loadingCitas ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Cargando...
                    </td>
                  </tr>
                ) : citasRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Aún no tienes citas registradas.
                    </td>
                  </tr>
                ) : (
                  citasRecientes.map((c) => (
                    <tr
                      key={
                        c.idagendacitas ??
                        `${c.placa}-${c.idcotizaciones}-${c.fecha}`
                      }
                    >
                      <td>{fmtDateTime(c.fecha)}</td>
                      <td className="fw-bold">{c.placa || "-"}</td>
                      <td>{c.idcotizaciones ?? "-"}</td>
                      <td>
                        <span className={`badge ${badgeClass(c.estado)}`}>
                          {c.estado || "Sin estado"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Para ver todo el historial, entra a <strong>Historial de citas</strong>.
          </div>
        </div>
      </div>

      <FooterCliente />
    </div>
  );
}
