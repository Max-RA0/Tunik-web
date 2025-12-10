import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InicioSesion.css";

const API_REGISTER = "https://tunik-api.onrender.com/api/auth/register";

const Registrarse = () => {
  const [numero_documento, setNumeroDocumento] = useState("");
  const [tipo_documento, setTipoDocumento] = useState("CC");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensaje("");

    const payload = {
      numero_documento: numero_documento.trim(),
      tipo_documento: String(tipo_documento || "").trim(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      contrasena,
      idroles: 2,
    };

    if (
      !payload.numero_documento ||
      !payload.tipo_documento ||
      !payload.nombre ||
      !payload.telefono ||
      !payload.email
    ) {
      setMensaje("❌ Completa todos los campos");
      return;
    }

    if (contrasena.length < 6) {
      setMensaje("❌ La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    if (contrasena !== confirmar) {
      setMensaje("❌ Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        setMensaje("✅ Registro exitoso. Ahora inicia sesión.");
        setTimeout(() => navigate("/"), 1200);
      } else {
        setMensaje(`❌ ${data.msg || "No se pudo registrar"}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Registrarse</h2>

        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label>Tipo de documento:</label>
            <select
              value={tipo_documento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              disabled={loading}
              style={{ padding: 10, borderRadius: 10 }}
            >
              <option value="CC">CC</option>
              <option value="TI">TI</option>
              <option value="CE">CE</option>
              <option value="PAS">PAS</option>
            </select>
          </div>

          <div className="form-group">
            <label>Número de documento:</label>
            <input
              type="text"
              value={numero_documento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              required
              placeholder="Ej: 1020..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Teléfono:</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              placeholder="300..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Correo:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              placeholder="********"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña:</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              placeholder="********"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="olvide-pass" onClick={() => navigate("/")}>
            ¿Ya tienes cuenta? Inicia sesión
          </p>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </div>
  );
};

export default Registrarse;
