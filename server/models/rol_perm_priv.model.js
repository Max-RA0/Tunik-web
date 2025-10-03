// server/models/rol_perm_priv.model.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo de persistencia (JSON)
export const DATA_DIR = path.resolve(__dirname, "../data");
export const DATA_FILE = path.resolve(DATA_DIR, "roles.acl.json");

/** ----- Datos "quemados" ----- **/
export const PERMISOS = [
  { id: 1, key: "usuarios", label: "Gestión de Usuarios" },
  { id: 2, key: "servicios", label: "Gestión de Servicios" },
  { id: 3, key: "ventas",    label: "Gestión de Ventas" },
  { id: 4, key: "evaluacion",label: "Evaluación Servicios" },
  { id: 5, key: "vehiculos", label: "Vehículos" },
  { id: 6, key: "config",    label: "Configuración" },
];

export const PRIVILEGIOS = [
  { id: 1, key: "registrar", label: "Registrar" },
  { id: 2, key: "buscar",    label: "Buscar" },
  { id: 3, key: "editar",    label: "Editar" },
  { id: 4, key: "eliminar",  label: "Eliminar" },
];

/** Helpers de validación */
const validPermKeys = new Set(PERMISOS.map(p => p.key));
const validPrivKeys = new Set(PRIVILEGIOS.map(p => p.key));

export function normalizeAclPayload(payload = {}) {
  const srcPerms = Array.isArray(payload.permisos) ? payload.permisos : [];
  const srcPrivs = Array.isArray(payload.privilegios) ? payload.privilegios : [];
  const permisos = [...new Set(srcPerms.filter(k => validPermKeys.has(k)))];
  const privilegios = [...new Set(srcPrivs.filter(k => validPrivKeys.has(k)))];
  return { permisos, privilegios };
}

/** Carga/guarda JSON */
export async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "{}", "utf-8");
  }
}

export async function loadAclMap() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const obj = JSON.parse(raw || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export async function saveAclMap(map) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(map, null, 2), "utf-8");
}
