import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/sidebar.css";

export default function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 280,
          flex: 1,
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f6f7f9 0%, #eef2f6 100%)",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}