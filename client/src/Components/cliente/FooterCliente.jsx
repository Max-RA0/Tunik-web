import React from "react";
import { Link } from "react-router-dom";
import "./FooterCliente.css";

export default function FooterCliente() {
  return (
    <footer className="tunik-footer">
      <div className="container">
        <div className="row tunik-footerGrid">
          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <h4 className="tunik-footerTitle">Tunik</h4>
            <p className="tunik-footerText">
              Estética automotriz en Medellín. Agenda tu cita, revisa tu historial y evalúa el servicio.
            </p>

            <ul className="tunik-social">
              <li><a href="#" aria-label="Facebook"><i className="bi bi-facebook" /></a></li>
              <li><a href="#" aria-label="Instagram"><i className="bi bi-instagram" /></a></li>
              <li><a href="#" aria-label="WhatsApp"><i className="bi bi-whatsapp" /></a></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <h4 className="tunik-footerTitle">Cliente</h4>
            <ul className="tunik-footerLinks">
              <li><Link to="/landing">Inicio</Link></li>
              <li><Link to="/cliente/agendamiento">Agendar cita</Link></li>
              <li><Link to="/cliente/historial-citas">Historial de citas</Link></li>
              <li><Link to="/cliente/evaluacion">Evaluar servicio</Link></li>
              <li><Link to="/cliente/perfil">Perfil</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-12">
            <h4 className="tunik-footerTitle">Contacto</h4>
            <p className="tunik-footerLine">
              <i className="bi bi-geo-alt me-2" /> Carrera 65D #32-35, Barrio Belén, Medellín
            </p>
            <p className="tunik-footerLine">
              <i className="bi bi-telephone me-2" /> 604-571-40-59 / 574-574-6-53
            </p>
            <p className="tunik-footerLine">
              <i className="bi bi-envelope me-2" /> info@tunik.com
            </p>
          </div>
        </div>

        <div className="tunik-copyright">
          <span>© {new Date().getFullYear()} Tunik. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
