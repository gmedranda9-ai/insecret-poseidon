import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/* Compra automática de invitaciones personales (InSecret · Poseidón).
   - El navegador llama con { action: 'crear' | 'estado' | 'editar_get' | 'editar_guardar' }.
   - n8n llama con { action: 'pagado' } y el secreto compartido, DESPUÉS de verificar el pago con PayPhone.
   El precio se calcula aquí, nunca viene del navegador. */

const SITE = "https://insecret.poseidonmk.com";
const ALLOW = [SITE, "http://localhost:8123"];
const SB = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
let SECRET = "", LINK_URL = "";
const BREVO = (Deno.env.get("BREVO_API_KEY") || "").trim();

const PRICES: Record<string, number> = { navidad: 1290, fin: 1290, cumple: 1290, cita: 1290 }; // centavos de USD
const NAMES: Record<string, string> = { navidad: "Cena navideña", fin: "Fin de año", cumple: "Cumpleaños", cita: "Cita romántica" };

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return { "Access-Control-Allow-Origin": ALLOW.includes(o) ? o : ALLOW[0], "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-ins-secret", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
const json = (req: Request, o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors(req), "Content-Type": "application/json" } });
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function rpc(fn: string, body: unknown) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return await r.json().catch(() => ({}));
}
async function loadCfg() { if (!SECRET) { const t = await rpc("cfg_get", { p_k: "ins_shared_secret" }); SECRET = typeof t === "string" ? t : ""; } if (!LINK_URL) { const u = await rpc("cfg_get", { p_k: "n8n_link_url" }); LINK_URL = typeof u === "string" ? u : ""; } }
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

/* ---------- limpieza de la configuración que llega del navegador ---------- */
const S = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n) : "");
const HEX = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
function cleanConfig(c: any): { cfg?: Record<string, unknown>; error?: string } {
  if (!c || typeof c !== "object") return { error: "BAD_INPUT" };
  const date = S(c.date, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) return { error: "BAD_DATE" };
  const when = new Date(date + ":00-05:00").getTime();
  if (!Number.isFinite(when) || when < Date.now() + 3600e3 || when > Date.now() + 800 * 864e5) return { error: "BAD_DATE" };
  const title = S(c.title, 60); if (!title) return { error: "NO_TITLE" };
  const url = S(c.maplink, 300);
  const pairs = (a: unknown, max: number, l1: number, l2: number) => (Array.isArray(a) ? a.slice(0, max).map((r) => (Array.isArray(r) ? [S(r[0], l1), S(r[1], l2)] : ["", ""])).filter((r) => r[1]) : []);
  const dr = Array.isArray(c.dress) ? c.dress : [];
  const cs = Array.isArray(dr[1]) ? dr[1] : [];
  const ex = Array.isArray(c.extra) ? c.extra : [];
  const rs = Array.isArray(c.rsvp) ? c.rsvp : [];
  const cfg: Record<string, unknown> = {
    lead: S(c.lead, 50), to: S(c.to, 60), host: S(c.host, 80), title, msg: S(c.msg, 260), date,
    place: S(c.place, 90), mapq: S(c.mapq, 120), maplink: /^https:\/\/[^\s]+$/.test(url) ? url : "", noguests: !!c.noguests,
    it: pairs(c.it, 10, 5, 80), menu: pairs(c.menu, 8, 30, 90),
    dress: [S(dr[0], 140), [HEX(cs[0], "#888888"), HEX(cs[1], "#aaaaaa"), HEX(cs[2], "#cccccc")]],
    extra: ["gi", S(ex[1], 40), S(ex[2], 240)],
    rsvp: [S(rs[0], 50) || "¿Nos acompañas?", S(rs[1], 24) || "Sí, voy", S(rs[2], 24) || "No puedo"],
  };
  const tg = S(c.target, 16); if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tg)) cfg.target = tg;
  return { cfg };
}

/* ---------- correo de compra ---------- */
async function mailBuyer(r: { name: string; email: string; title: string; slug: string; host: string; edit: string }) {
  if (!BREVO.startsWith("xkeysib-")) return;
  const inv = `${SITE}/invitacion/?i=${r.slug}`, host = `${SITE}/anfitrion/?h=${r.host}`, ed = `${SITE}/editar/?e=${r.edit}`;
  const first = esc(r.name.split(" ")[0]);
  const btn = (h: string, l: string, solid: boolean) => `<a href="${esc(h)}" style="display:block;text-align:center;text-decoration:none;font:700 15px Arial,sans-serif;padding:14px 18px;border-radius:999px;margin:10px 0;${solid ? "background:#e3c27a;color:#1a1405;" : "border:2px solid #e3c27a;color:#e3c27a;"}">${l}</a>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body bgcolor="#060b16" style="margin:0;background:#060b16;padding:22px 10px;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="520" cellpadding="0" cellspacing="0" bgcolor="#0b1220" style="max-width:520px;width:100%;background:#0b1220;border:1px solid #3a3320;border-radius:16px"><tr><td style="padding:30px 26px;color:#e9e4d6">
<div style="font:700 12px Arial;letter-spacing:.3em;text-transform:uppercase;color:#e3c27a;text-align:center">Poseidón · Invitaciones</div>
<h2 style="margin:14px 0 10px;font:700 26px Georgia,serif;text-align:center;color:#f3dfae">¡Tu invitación está lista, ${first}!</h2>
<p style="line-height:1.7;font-size:15px;margin:0 0 14px;text-align:center">«${esc(r.title)}» ya está activa. Compártela con tus invitados:</p>
${btn(inv, "Ver y compartir mi invitación", true)}
<p style="font-size:13px;line-height:1.6;color:#aeb6c6;margin:14px 0 4px;text-align:center"><b style="color:#e3c27a">Tu panel privado</b>: aquí ves quién confirmó, con cuántas personas y sus mensajes. No lo compartas.</p>
${btn(host, "Abrir mi panel", false)}
<p style="font-size:13px;line-height:1.6;color:#aeb6c6;margin:14px 0 4px;text-align:center"><b style="color:#e3c27a">Editar</b>: puedes corregir datos (hasta 5 veces, hasta el día del evento). El enlace de tu invitación no cambia.</p>
${btn(ed, "Editar mi invitación", false)}
<p style="font-size:12px;color:#7f8aa0;margin:18px 0 0;text-align:center">Guarda este correo: aquí están tus tres enlaces. ¿Dudas? Escríbenos a soporte@poseidonmk.com</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `¡Tu invitación está lista, ${r.name.split(" ")[0]}!\n\n«${r.title}»\n\nCompártela: ${inv}\nTu panel privado (no lo compartas): ${host}\nEditar (hasta 5 veces, hasta el día del evento): ${ed}\n\nSoporte: soporte@poseidonmk.com`;
  await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": BREVO, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Poseidón · Invitaciones", email: "no-reply@poseidonmk.com" }, replyTo: { email: "soporte@poseidonmk.com" }, to: [{ email: r.email, name: r.name }], subject: `Tu invitación «${r.title}» está lista`, htmlContent: html, textContent: text }) }).catch(() => {});
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() { const b = crypto.getRandomValues(new Uint8Array(11)); return "INS-" + Array.from(b, (x) => ALPHA[x % ALPHA.length]).join(""); } // 15 caracteres

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "METHOD" }, 405);
  let b: any; try { b = await req.json(); } catch { return json(req, { error: "BAD_INPUT" }, 400); }
  const a = String(b.action || "");
  if (a === "pagado" || a === "crear") await loadCfg();

  /* --- n8n: pago ya verificado con PayPhone --- */
  if (a === "pagado") {
    if (!SECRET || !same(req.headers.get("x-ins-secret") || "", SECRET)) return json(req, { error: "FORBIDDEN" }, 403);
    const code = String(b.code || ""), cents = Math.round(Number(b.amount_cents));
    if (!/^INS-[A-Z0-9]{11}$/.test(code) || !Number.isFinite(cents)) return json(req, { error: "BAD_INPUT" }, 400);
    const r = await rpc("ord_paid", { p_code: code, p_tx: String(b.transaction_id || "").slice(0, 60), p_amount: cents });
    if (r.error) return json(req, r, r.error === "NOT_FOUND" ? 404 : 409);
    if (!r.already) await mailBuyer({ name: r.name, email: r.email, title: r.title, slug: r.slug, host: r.host_token, edit: r.edit_token });
    return json(req, { ok: true, already: !!r.already });
  }

  /* --- navegador --- */
  if (a === "crear") {
    if (b.web) return json(req, { ok: true }); // trampa para robots
    const theme = String(b.theme || ""); const cents = PRICES[theme];
    if (!cents) return json(req, { error: "BAD_THEME" }, 400);
    const name = S(b.name, 80), email = S(b.email, 120).toLowerCase(), phone = S(b.phone, 20).replace(/[^\d+]/g, ""), doc = S(b.doc, 13).replace(/\D/g, "");
    if (name.length < 2) return json(req, { error: "BAD_NAME" }, 400);
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return json(req, { error: "BAD_EMAIL" }, 400);
    if (doc && !/^(\d{10}|\d{13})$/.test(doc)) return json(req, { error: "BAD_DOC" }, 400);
    const cc = cleanConfig(b.config); if (cc.error) return json(req, { error: cc.error }, 400);
    if (!LINK_URL || !SECRET) return json(req, { error: "NOT_READY" }, 503);
    const code = newCode();
    const o = await rpc("ord_create", { p_code: code, p_theme: theme, p_config: cc.cfg, p_name: name, p_email: email, p_phone: phone, p_doc: doc, p_amount: cents });
    if (o.error) return json(req, { error: o.error === "RATE" ? "RATE" : "SERVER" }, o.error === "RATE" ? 429 : 500);
    let url = "";
    try {
      const r = await fetch(LINK_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-ins-secret": SECRET },
        body: JSON.stringify({ code, amount_cents: cents, email, phone, reference: `InSecret ${NAMES[theme]} ${code}`.slice(0, 60), description: `Invitación interactiva · ${NAMES[theme]}` }), signal: AbortSignal.timeout(20000) });
      const j = await r.json().catch(() => ({})); url = typeof j.url === "string" ? j.url : "";
    } catch { /* se reporta abajo */ }
    if (!/^https:\/\//.test(url)) return json(req, { error: "LINK" }, 502);
    await rpc("ord_set_url", { p_code: code, p_url: url });
    return json(req, { ok: true, code, url, amount_cents: cents });
  }
  if (a === "estado") {
    const code = String(b.code || ""); if (!/^INS-[A-Z0-9]{11}$/.test(code)) return json(req, { error: "BAD_INPUT" }, 400);
    return json(req, await rpc("ord_status", { p_code: code }));
  }
  if (a === "editar_get") {
    const t = String(b.token || ""); if (!/^[A-Za-z0-9_-]{16,80}$/.test(t)) return json(req, { error: "BAD_INPUT" }, 400);
    return json(req, await rpc("ed_get", { p_token: t }));
  }
  if (a === "editar_guardar") {
    const t = String(b.token || ""); if (!/^[A-Za-z0-9_-]{16,80}$/.test(t)) return json(req, { error: "BAD_INPUT" }, 400);
    const cc = cleanConfig(b.config); if (cc.error) return json(req, { error: cc.error }, 400);
    return json(req, await rpc("ed_save", { p_token: t, p_config: cc.cfg }));
  }
  return json(req, { error: "BAD_ACTION" }, 400);
});
