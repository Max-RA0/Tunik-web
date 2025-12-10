// src/utils/acl.js

/**
 * Guarda ACL (objeto { permisos: string[], privilegios: { [submod]: string[] } })
 */
export function saveACL(acl) {
  try {
    localStorage.setItem("acl", JSON.stringify(acl || {}));
  } catch {}
}

/** Lee ACL desde localStorage (si no hay, devuelve estructura vacía) */
export function getACL() {
  try {
    const raw = localStorage.getItem("acl");
    const obj = raw ? JSON.parse(raw) : null;
    if (obj && typeof obj === "object") {
      const permisos = Array.isArray(obj.permisos) ? obj.permisos : [];
      const privilegios = obj.privilegios && typeof obj.privilegios === "object" ? obj.privilegios : {};
      return { permisos, privilegios };
    }
  } catch {}
  return { permisos: [], privilegios: {} };
}

/** ¿Tiene el rol permiso para ver un subproceso (submod)? */
export function canUse(submod) {
  const { permisos } = getACL();
  return permisos.includes(submod);
}

/** ¿Tiene privilegio (acción) en un subproceso? */
export function can(submod, action) {
  const { privilegios } = getACL();
  const arr = privilegios?.[submod] || [];
  return arr.includes(action);
}
