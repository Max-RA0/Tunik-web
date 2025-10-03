import { useState } from "react";
import { useNavigate } from "react-router-dom";

const InicioSesion = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate(); // Hook de React Router para redirigir

  const handleLogin = async (e) => {
    e.preventDefault();
    

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contrasena }),
      });

      const data = await response.json();

      if (data.ok) {
        // Guardar token en localStorage (opcional)
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Redirigir a otra página
        navigate("/dashboard"); // <-- CAMBIA esta ruta por la que quieras
      } else {
        setMensaje(`❌ ${data.msg}`);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setMensaje("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Correo:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        <button type="submit">Ingresar</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default InicioSesion;
