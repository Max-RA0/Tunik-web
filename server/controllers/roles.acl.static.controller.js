// server/controllers/roles.acl.static.controller.js
import { PERMISOS, PRIVILEGIOS, loadAclMap, saveAclMap, normalizeAclPayload } 
  from "../models/rol_perm_priv.model.js";

/** GET /api/roles/acl-options */
export async function getOptions(req, res) {
  return res.json({
    ok: true,
    data: {
      permisos: PERMISOS,
      privilegios: PRIVILEGIOS,
    },
  });
}

/** GET /api/roles/:id/acl */
export async function getAcl(req, res) {
  const roleId = String(req.params.id);
  const map = await loadAclMap();
  const current = map[roleId] || { permisos: [], privilegios: [] };
  return res.json({ ok: true, data: normalizeAclPayload(current) });
}

/** PUT /api/roles/:id/acl  { permisos:[], privilegios:[] } */
export async function putAcl(req, res) {
  const roleId = String(req.params.id);
  const incoming = normalizeAclPayload(req.body || {});
  const map = await loadAclMap();
  map[roleId] = incoming;
  await saveAclMap(map);
  return res.json({ ok: true, msg: "ACL actualizada", data: incoming });
}
