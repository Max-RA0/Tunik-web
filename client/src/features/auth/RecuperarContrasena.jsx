import { useState } from "react";
import "./InicioSesion.css"; // reutilizamos exactamente los mismos estilos

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await fetch("https://tunik-api.onrender.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.ok) {
        setMensaje("📩 Se ha enviado un enlace de recuperación a tu correo.");
      } else {
        setMensaje(`❌ ${data.msg}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Recuperar Contraseña</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo registrado:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu-correo@ejemplo.com"
            />
          </div>

          <button type="submit" className="btn-login">
            Enviar enlace
          </button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </div>
  );
};

export default RecuperarContrasena;
