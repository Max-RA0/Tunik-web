import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./InicioSesion.css";

const NuevaContrasena = () => {
  const { token } = useParams();
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("acl");
  };

  // 🔥 Al entrar, cerrar cualquier sesión previa (incluye ACL)
  useEffect(() => {
    clearAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (contrasena !== confirmar) {
      setMensaje("❌ Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://tunik-api.onrender.com/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nuevaPassword: contrasena }),
        }
      );

      const data = await res.json();

      if (data.ok) {
        setMensaje("✅ Tu contraseña ha sido actualizada. Vuelve a iniciar sesión.");

        // 🔥 limpiar TODO
        clearAuth();

        // ✅ redirección fuerte al login real ("/")
        setTimeout(() => window.location.replace("/"), 1200);
      } else {
        setMensaje(`❌ ${data.msg}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("⚠️ Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Nueva Contraseña</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Nueva contraseña:</label>
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
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </div>
  );
};

export default NuevaContrasena;
