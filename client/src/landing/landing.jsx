import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import HeaderCliente from "../Components/cliente/HeaderCliente";
import FooterCliente from "../Components/cliente/FooterCliente";
import "./landing.css";

const API = "http://localhost:3000/api";
const SER_URL = `${API}/servicios`;

const BEFORE_AFTER = [
  { before: "/img/bmw antes.jfif", after: "/img/bmw despues.jfif", altB: "Antes 1", altA: "Después 1" },
  { before: "/img/mustang antes.jfif", after: "/img/mustang despues.jfif", altB: "Antes 2", altA: "Después 2" },
  { before: "/img/sandero antes.jfif", after: "/img/sandero despues.jfif", altB: "Antes 3", altA: "Después 3" },
  { before: "/img/toyota antes.jfif", after: "/img/toyota despues.jfif", altB: "Antes 4", altA: "Después 4" },
];

const TESTIMONIALS = [
  { text: "Excelente servicio, me dejaron el carro impecable.", name: "Carlos Rodríguez", title: "Cliente" },
  { text: "Muy rápidos y muy profesionales. Recomendados.", name: "Laura Gómez", title: "Cliente" },
  { text: "El acabado quedó brutal, volvería sin pensarlo.", name: "Andrés Martínez", title: "Cliente" },
];

function moneyCOP(v) {
  const n = Number(v || 0);
  try {
    return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  } catch {
    return `$ ${n}`;
  }
}

function pickIcon(catName = "") {
  const c = String(catName || "").toLowerCase();
  if (c.includes("manten")) return "bi bi-shield-check";
  if (c.includes("repara")) return "bi bi-tools";
  if (c.includes("pintu") || c.includes("lato")) return "bi bi-palette";
  return "bi bi-stars";
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "T";
  const b = parts[1]?.[0] || "K";
  return (a + b).toUpperCase();
}

/* Before/After */
function BeforeAfter({ beforeSrc, afterSrc, altBefore, altAfter, defaultValue = 50 }) {
  const [value, setValue] = useState(defaultValue);

  const clipPath = useMemo(() => {
    const pct = Number(value || 50);
    return `inset(0 ${100 - pct}% 0 0)`;
  }, [value]);

  return (
    <div className="beforeafter-container">
      <img className="ba-img before-img" src={beforeSrc} alt={altBefore} />
      <img className="ba-img after-img" src={afterSrc} alt={altAfter} style={{ clipPath }} />
      <input
        className="ba-slider"
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default function LandingCliente() {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  async function fetchServicios() {
    setLoadingServices(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(SER_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const list = data?.data || data || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    fetchServicios();
  }, []);

  return (
    <div className="landing-page">
      <HeaderCliente />

      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <img
                src="/img/m240i.jfif"
                alt="Vehículo personalizado"
                className="img-fluid hero-img"
              />
            </div>

            <div className="col-lg-6">
              <h1 className="hero-title">Icon Medellín</h1>

              <p className="hero-text">
                Estética automotriz en Medellín. Agenda tu cita, revisa tu historial y evalúa nuestro servicio.
              </p>

              <div className="hero-actions">
                <Link to="/cliente/agendamiento" className="btn hero-btn hero-btnPrimary">
                  Agendar cita
                </Link>
                <Link to="/cliente/historial-citas" className="btn hero-btn hero-btnGhost">
                  Ver historial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios (BD) */}
      <section className="services-section" id="servicios">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Nuestros Servicios</h2>
            <p className="section-subtitle">Estos servicios vienen directamente de tu base de datos.</p>
          </div>

          {loadingServices ? (
            <div className="text-center py-4 text-muted">Cargando servicios...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-4 text-muted">No hay servicios registrados.</div>
          ) : (
            <div className="row">
              {services.map((s) => {
                const cat =
                  s?.categoria ||
                  s?.categoriaservicio ||
                  s?.categoriaservicios ||
                  s?.CategoriaServicio ||
                  null;

                const catName =
                  cat?.nombrecategorias ||
                  cat?.nombre ||
                  s?.nombrecategorias ||
                  "";

                return (
                  <div key={s.idservicios} className="col-lg-4 col-md-6">
                    <div className="service-card">
                      <div className="service-icon">
                        <i className={pickIcon(catName)} />
                      </div>

                      <h3 className="service-title">{s.nombreservicios}</h3>

                      <p className="service-desc">
                        <span className="service-meta">
                          <i className="bi bi-tag me-2" />
                          {catName || "Sin categoría"}
                        </span>
                        <span className="service-meta">
                          <i className="bi bi-cash-coin me-2" />
                          {moneyCOP(s.preciounitario)}
                        </span>
                      </p>

                      <div className="service-cta">
                        <Link to="/cliente/agendamiento" className="btn service-btn">
                          Agendar con este servicio
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Antes & Después */}
      <section className="beforeafter-section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Antes y Después</h2>
            <p className="section-subtitle">Desliza para comparar.</p>
          </div>

          <div className="row">
            {BEFORE_AFTER.map((b, idx) => (
              <div key={idx} className="col-lg-6 col-md-12 mb-4">
                <BeforeAfter beforeSrc={b.before} afterSrc={b.after} altBefore={b.altB} altAfter={b.altA} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">¿Listo para transformar tu vehículo?</h2>
          <p className="cta-text">Agenda una cita en menos de 1 minuto.</p>
          <Link to="/cliente/agendamiento" className="btn btn-cta">
            Agendar cita ahora
          </Link>
        </div>
      </section>

      {/* Testimonios */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title text-white">Lo que dicen nuestros clientes</h2>
            <p className="section-subtitle text-white-50">Opiniones reales del servicio.</p>
          </div>

          <div className="row">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="col-lg-4 col-md-6">
                <div className="testimonial-card">
                  <p className="testimonial-text">“{t.text}”</p>

                  <div className="testimonial-author">
                    <div className="author-avatar" aria-hidden="true">
                      {initials(t.name)}
                    </div>
                    <div>
                      <h5 className="author-name">{t.name}</h5>
                      <p className="author-title">{t.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <Link to="/cliente/evaluacion" className="btn btn-outline-light">
              <i className="bi bi-star me-2" />
              Evaluar servicio
            </Link>
          </div>
        </div>
      </section>

      <FooterCliente />
    </div>
  );
}
