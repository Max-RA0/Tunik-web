// src/pages/Dashboard.jsx
export default function Dashboard() {
  return (
    <main className="main-content ml-[280px] p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Principal</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <p className="text-2xl font-bold">120</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold">Ventas</h2>
          <p className="text-2xl font-bold">$8,430</p>
        </div>
        <div className="bg-purple-500 text-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold">Servicios</h2>
          <p className="text-2xl font-bold">34</p>
        </div>
      </div>
    </main>
  );
}
