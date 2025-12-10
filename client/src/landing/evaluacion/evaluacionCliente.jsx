// client/src/landing/evaluacionCliente.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import HeaderCliente from "../../Components/cliente/HeaderCliente";
import FooterCliente from "../../Components/cliente/FooterCliente";
import "./evaluacionCliente.css";

const API = "http://localhost:3000/api";
const SER_URL = `${API}/servicios`;
const EV_URL = `${API}/evaluaciones`;

function safeUser() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function getNumeroDocumento(usuario) {
  // tolera varios nombres posibles
  return (
    usuario?.numero_documento ??
    usuario?.numeroDocumento ??
    usuario?.documento ??
    usuario?.cedula ??
    ""
  );
}

export default function EvaluacionCliente() {
  const usuario = useMemo(() => safeUser(), []);
  const numero_documento = useMemo(() => String(getNumeroDocumento(usuario) || ""), [usuario]);

  // data
  const [services, setServices] = useState([]);

  // form
  const [idservicios, setIdservicios] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  // ui
  const [loadingServices, setLoadingServices] = useState(true);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");

  const estrellasActivas = useMemo(() => (hover ? hover : rating), [hover, rating]);

  async function fetchServicios() {
    setLoadingServices(true);
    setError("");
    try {
      const { data } = await axios.get(SER_URL);
      const list = data?.data || data || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setServices([]);
      setError("No se pudieron cargar los servicios.");
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    fetchServicios();
  }, []);

  function reset() {
    setIdservicios("");
    setComentarios("");
    setRating(0);
    setHover(0);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setOkMsg("");
    setError("");

    const token = localStorage.getItem("token");

    if (!numero_documento) {
      setError("No se encontró el usuario logueado (número de documento).");
      return;
    }

    const r = Number(rating);
    if (!idservicios || !r || r < 1 || r > 5) {
      setError("Completa el servicio y selecciona una calificación (1 a 5).");
      return;
    }

    const payload = {
      numero_documento,
      idservicios: Number(idservicios),
      respuestacalificacion: r,
      comentarios: String(comentarios || "").trim(),
    };

    try {
      setSending(true);
      const { data } = await axios.post(EV_URL, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!data?.ok) throw new Error(data?.msg || "Error guardando evaluación");

      setOkMsg("¡Gracias! Tu evaluación fue enviada.");
      reset();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.msg || err.message || "Error enviando evaluación");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="eval-page">
      <HeaderCliente />

      <div className="container py-5">
        <h2 className="mb-2 text-center">Califica tu experiencia con Tunik</h2>
        <p className="text-center text-muted mb-4">Tu opinión es importante para nosotros.</p>

        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-6">
            <div className="eval-card">
              {okMsg ? <div className="alert alert-success">{okMsg}</div> : null}
              {error ? <div className="alert alert-danger">{error}</div> : null}

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="servicio" className="form-label">
                    Servicio recibido
                  </label>

                  <select
                    className="form-select"
                    id="servicio"
                    value={idservicios}
                    onChange={(e) => setIdservicios(e.target.value)}
                    required
                    disabled={loadingServices}
                  >
                    <option value="">
                      {loadingServices ? "Cargando servicios..." : "Selecciona un servicio"}
                    </option>

                    {services.map((s) => (
                      <option key={s.idservicios} value={s.idservicios}>
                        {s.nombreservicios}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Calificación</label>

                  <div className="star-rating" role="radiogroup" aria-label="Calificación 1 a 5">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const on = i <= estrellasActivas;
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`star-btn ${on ? "on" : ""}`}
                          onMouseEnter={() => setHover(i)}
                          onMouseLeave={() => setHover(0)}
                          onFocus={() => setHover(i)}
                          onBlur={() => setHover(0)}
                          onClick={() => setRating(i)}
                          role="radio"
                          aria-checked={rating === i}
                          aria-label={`${i} estrellas`}
                          title={`${i} estrellas`}
                        >
                          <i className={`bi ${on ? "bi-star-fill" : "bi-star"}`} />
                        </button>
                      );
                    })}
                  </div>

                  <div className="small text-muted mt-2">
                    Seleccionado: <strong>{rating || 0}</strong>/5
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="comentarios" className="form-label">
                    Comentarios (opcional)
                  </label>
                  <textarea
                    className="form-control"
                    id="comentarios"
                    rows="3"
                    placeholder="Cuéntanos tu experiencia..."
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar evaluación"}
                </button>
              </form>
            </div>

            <div className="text-center mt-3">
              <button type="button" className="btn btn-link" onClick={fetchServicios} disabled={loadingServices}>
                Recargar servicios
              </button>
            </div>
          </div>
        </div>
      </div>

      <FooterCliente />
    </div>
  );
}
