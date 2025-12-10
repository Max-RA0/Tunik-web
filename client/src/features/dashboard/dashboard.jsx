// client/src/features/dashboard/dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Legend, Cell,
  LineChart, Line
} from "recharts";
import "./dashboard.css";

const API = "http://localhost:3000/api/dashboard/metrics";

function moneyCOP(n = 0) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

const PIE_COLORS = ["#ef233c","#ff4d6d","#60a5fa","#22c55e","#f59e0b","#a78bfa"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");

  const fetchMetrics = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setErr(json?.msg || "Error cargando métricas");
        setData(null);
      } else setData(json);
    } catch (e) {
      setErr(e.message || "Error cargando métricas");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const cards = data?.cards || {};
  const charts = data?.charts || {};

  const usuariosPorRol = useMemo(() => charts.usuariosPorRol || [], [charts]);
  const vehiculosPorMarca = useMemo(() => charts.vehiculosPorMarca || [], [charts]);
  const pedidosPorEstado = useMemo(() => charts.pedidosPorEstado || [], [charts]);
  const cotizacionesPorEstado = useMemo(() => charts.cotizacionesPorEstado || [], [charts]);
  const serviciosPorCategoria = useMemo(() => charts.serviciosPorCategoria || [], [charts]);
  const pedidosUltimos30Dias = useMemo(() => charts.pedidosUltimos30Dias || [], [charts]);
  const productosBajoStock = useMemo(() => charts.productosBajoStock || [], [charts]);

  const axisTick = { fill: "rgba(226,232,240,.75)", fontSize: 12, fontWeight: 700 };
  const gridStroke = "rgba(226,232,240,.08)";

  return (
    <main className="dash">
      <header className="dash__header">
        <div>
          <h1 className="dash__title">Dashboard</h1>
          <div className="dash__subtitle">Resumen en tiempo real (datos desde MySQL)</div>
        </div>
        <button onClick={fetchMetrics} className="dash__btn">Recargar</button>
      </header>

      {loading && (
        <div className="dashCard alert">
          <div className="dashCard__inner">Cargando métricas…</div>
        </div>
      )}

      {err && !loading && <div className="alert alert--error">{err}</div>}

      {!loading && data && (
        <>
          {/* Cards */}
          <div className="dash__gridCards">
            <div className="dashCard"><div className="dashCard__inner">
              <div className="dashCard__kicker">Usuarios</div>
              <div className="dashCard__value">{cards.usuarios ?? 0}</div>
              <div className="dashCard__hint">Registrados en el sistema</div>
            </div></div>

            <div className="dashCard"><div className="dashCard__inner">
              <div className="dashCard__kicker">Vehículos</div>
              <div className="dashCard__value">{cards.vehiculos ?? 0}</div>
              <div className="dashCard__hint">Vehículos asociados</div>
            </div></div>

            <div className="dashCard"><div className="dashCard__inner">
              <div className="dashCard__kicker">Servicios</div>
              <div className="dashCard__value">{cards.servicios ?? 0}</div>
              <div className="dashCard__hint">Catálogo activo</div>
            </div></div>

            <div className="dashCard"><div className="dashCard__inner">
              <div className="dashCard__kicker">Pedidos</div>
              <div className="dashCard__value">{cards.pedidos ?? 0}</div>
              <div className="dashCard__hint">Órdenes a proveedor</div>
            </div></div>

            <div className="dashCard"><div className="dashCard__inner">
              <div className="dashCard__kicker">Ingresos (cotiz.)</div>
              <div className="dashCard__value" style={{ fontSize: 22 }}>
                {moneyCOP(cards.ingresos ?? 0)}
              </div>
              <div className="dashCard__hint">Cotizaciones completadas</div>
            </div></div>
          </div>

          {/* Charts */}
          <div className="dash__gridCharts">
            {/* Usuarios por rol */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Usuarios por rol</div>
              <div className="dashChart__sub">Distribución de usuarios según su rol</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={usuariosPorRol} barSize={34}>
                    <defs>
                      <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff4d6d" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#ef233c" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={axisTick} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip />
                    <Bar dataKey="value" fill="url(#barRed)" radius={[10,10,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vehículos por marca */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Vehículos por marca</div>
              <div className="dashChart__sub">Marcas más registradas en el sistema</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={vehiculosPorMarca} barSize={34}>
                    <defs>
                      <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.65} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={axisTick} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip />
                    <Bar dataKey="value" fill="url(#barBlue)" radius={[10,10,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pedidos por estado */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Pedidos por estado</div>
              <div className="dashChart__sub">Seguimiento general de pedidos</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip />
                    <Legend wrapperStyle={{ color: "rgba(226,232,240,.75)", fontWeight: 800 }} />
                    <Pie
                      data={pedidosPorEstado}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {pedidosPorEstado.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cotizaciones por estado */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Cotizaciones por estado</div>
              <div className="dashChart__sub">Cómo van las cotizaciones</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip />
                    <Legend wrapperStyle={{ color: "rgba(226,232,240,.75)", fontWeight: 800 }} />
                    <Pie
                      data={cotizacionesPorEstado}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {cotizacionesPorEstado.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Servicios por categoría */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Servicios por categoría</div>
              <div className="dashChart__sub">Cantidad de servicios por tipo</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={serviciosPorCategoria} barSize={34}>
                    <defs>
                      <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0.65} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={axisTick} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip />
                    <Bar dataKey="value" fill="url(#barGreen)" radius={[10,10,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pedidos últimos 30 días */}
            <div className="dashCard dashChart">
              <div className="dashChart__title">Pedidos (últimos 30 días)</div>
              <div className="dashChart__sub">Actividad reciente</div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={pedidosUltimos30Dias}>
                    <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={axisTick} />
                    <YAxis allowDecimals={false} tick={axisTick} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ff4d6d" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="dashCard dashChart" style={{ marginTop: 16 }}>
            <div className="dashChart__title">Inventario (menor stock)</div>
            <div className="dashChart__sub">Top 10 productos con menos unidades</div>

            <table className="dashTable">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {productosBajoStock.map((p, idx) => (
                  <tr key={`${p.nombreproductos}-${idx}`}>
                    <td style={{ fontWeight: 900 }}>{p.nombreproductos}</td>
                    <td>{p.cantidadexistente}</td>
                  </tr>
                ))}
                {productosBajoStock.length === 0 && (
                  <tr><td colSpan={2} style={{ color: "rgba(226,232,240,.7)" }}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
