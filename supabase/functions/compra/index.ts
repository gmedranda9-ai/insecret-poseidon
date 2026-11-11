import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/* Compra automática de invitaciones personales (InSecret · Poseidón).
   - El navegador llama con { action: 'crear' | 'estado' | 'editar_get' | 'editar_guardar' | 'proforma_crear' | 'proforma_estado' }.
   - n8n llama con { action: 'pagado' } y el secreto compartido, DESPUÉS de verificar el pago con PayPhone.
   El precio se calcula aquí, nunca viene del navegador. */

const SITE = "https://insecret.poseidonmk.com";
const ALLOW = [SITE, "http://localhost:8123"];
const SB = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
let SECRET = "", LINK_URL = "";
const BREVO = (Deno.env.get("BREVO_API_KEY") || "").trim();

const PRICES: Record<string, number> = { navidad: 1290, fin: 1290, cumple: 1290, cita: 1290 }; // subtotal en centavos de USD (+ IVA)
const IVA_PCT = 15; const ivaOf = (base: number) => Math.round(base * IVA_PCT / 100);
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
  const pal = Math.round(Number(c.pal));
  const cfg: Record<string, unknown> = {
    lead: S(c.lead, 50), to: S(c.to, 60), host: S(c.host, 80), title, msg: S(c.msg, 260), date,
    place: S(c.place, 90), mapq: S(c.mapq, 120), maplink: /^https:\/\/[^\s]+$/.test(url) ? url : "", noguests: !!c.noguests,
    it: pairs(c.it, 10, 5, 80), menu: pairs(c.menu, 8, 30, 90),
    dress: [S(dr[0], 140), [HEX(cs[0], "#888888"), HEX(cs[1], "#aaaaaa"), HEX(cs[2], "#cccccc")]],
    extra: ["gi", S(ex[1], 40), S(ex[2], 240)],
    rsvp: [S(rs[0], 50) || "¿Nos acompañas?", S(rs[1], 24) || "Sí, voy", S(rs[2], 24) || "No puedo"],
    pal: pal >= 1 && pal <= 3 ? pal : 0,
  };
  const tg = S(c.target, 16); if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tg)) cfg.target = tg;
  return { cfg };
}

/* ---------- correo de compra ---------- */
const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function fechaLarga(d: string) { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(d || ""); if (!m) return ""; const dt = new Date(+m[1], +m[2] - 1, +m[3]); const t = `${DIA[dt.getDay()]} ${+m[3]} de ${MES[+m[2] - 1]} · ${m[4]}:${m[5]} h`; return t.charAt(0).toUpperCase() + t.slice(1); }
const TH: Record<string, { emo: string; frase: string; acc: string; bg: string }> = {
  navidad: { emo: "🎄", frase: "Que esta Navidad nos encuentre juntos, entre luces, risas y buena mesa.", acc: "#e8c36a", bg: "#04201c" },
  fin: { emo: "🥂", frase: "Despidamos el año como se merece: juntos y con un brindis.", acc: "#e3c27a", bg: "#080a18" },
  cumple: { emo: "🎂", frase: "Celebremos otro año de vida… tu presencia es el mejor regalo.", acc: "#e3c27a", bg: "#0b1220" },
  cita: { emo: "💘", frase: "Una noche pensada con cariño, hecha para compartir.", acc: "#f3a9b6", bg: "#2a0813" },
};
/* paletas elegidas por el cliente: [color de acento, fondo] por ocasión (0 = la original) */
const PAL: Record<string, string[][]> = {
  navidad: [[], ["#e3b857", "#3a0a12"], ["#c9d3e0", "#10192f"], ["#d98c5a", "#35101f"]],
  fin: [[], ["#8a5a22", "#f7ecd2"], ["#7fa1ff", "#12151f"], ["#e8a598", "#241026"]],
  cumple: [[], ["#ffd9a8", "#4a1a63"], ["#ff4da6", "#190c30"], ["#a85a80", "#fdf1f5"]],
  cita: [[], ["#e9c9a0", "#14060a"], ["#f0a24a", "#3c1733"], ["#b9a7f2", "#0c1230"]],
};
function themeOf(theme: string, pal: unknown) {
  const T = TH[theme] || TH.navidad, p = (PAL[theme] || [])[Number(pal) || 0];
  if (!p || !p.length) return { ...T, light: false };
  const h = p[1].replace("#", ""), lum = (parseInt(h.slice(0, 2), 16) * 0.3 + parseInt(h.slice(2, 4), 16) * 0.59 + parseInt(h.slice(4, 6), 16) * 0.11);
  return { ...T, acc: p[0], bg: p[1], light: lum > 150 };
}
function shareText(theme: string, cfg: any, inv: string) {
  const T = TH[theme] || TH.navidad, host = String(cfg?.host || "").trim(), f = fechaLarga(cfg?.date);
  const L = [`${T.emo} ¡Estás invitado! ${T.emo}`, "", T.frase, "", `✨ ${cfg?.title || ""}${host ? " · de " + host : ""}`];
  if (f) L.push(`📅 ${f}`); if (cfg?.place) L.push(`📍 ${cfg.place}`);
  L.push("", "Abre tu invitación aquí 👇", inv, "", "Ahí podrás ver los detalles y confirmar tu asistencia 💌");
  return L.join("\n");
}
async function mailBuyer(r: { name: string; email: string; title: string; slug: string; host: string; edit: string; code: string; theme: string }) {
  if (!BREVO.startsWith("xkeysib-")) return;
  const g = await rpc("ed_get", { p_token: r.edit }); const cfg = g && g.config ? g.config : {};
  const T = themeOf(r.theme, cfg.pal);
  const tx = T.light ? "#2b2118" : "#ece7d8", tx2 = T.light ? "#5b5042" : "#aeb6c6", head = T.light ? "#2b2118" : "#fff3d6", btnInk = T.light ? "#ffffff" : "#1a1405";
  const inv = `${SITE}/invitacion/?i=${r.slug}`, host = `${SITE}/anfitrion/?h=${r.host}`, ed = `${SITE}/editar/?e=${r.edit}`, kit = `${SITE}/pedido/?c=${r.code}`;
  const first = esc(r.name.split(" ")[0]);
  const msg = shareText(r.theme, cfg, inv);
  const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const banner = `${SITE}/assets/mail/${TH[r.theme] ? r.theme : "navidad"}.jpg`;
  const btn = (h: string, l: string, solid: boolean) => `<a href="${esc(h)}" style="display:block;text-align:center;text-decoration:none;font:700 15px Arial,sans-serif;padding:15px 18px;border-radius:999px;margin:10px 0;${solid ? `background:${T.acc};color:${btnInk};` : `border:2px solid ${T.acc};color:${T.acc};`}">${l}</a>`;
  const sec = (t: string, d: string) => `<p style="font-size:13px;line-height:1.6;color:${tx2};margin:22px 0 2px;text-align:center"><b style="color:${T.acc};font-size:14px">${t}</b><br>${d}</p>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body bgcolor="#05080f" style="margin:0;background:#05080f;padding:20px 10px;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" bgcolor="${T.bg}" style="max-width:560px;width:100%;background:${T.bg};border:1px solid ${T.acc}55;border-radius:18px;overflow:hidden">
<tr><td style="padding:0"><img src="${banner}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0"></td></tr>
<tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:${T.acc}">&nbsp;</td></tr>
<tr><td style="padding:26px 28px 10px;color:${tx};text-align:center">
<img src="${SITE}/assets/logo.png" width="46" height="46" alt="Poseidón" style="display:inline-block;border:0;border-radius:50%">
<div style="font:700 11px Arial;letter-spacing:.32em;text-transform:uppercase;color:${T.acc};margin-top:8px">Poseidón · Invitaciones</div>
<h2 style="margin:16px 0 8px;font:700 28px Georgia,serif;color:${head}">¡Tu invitación está lista, ${first}!</h2>
<p style="font:italic 16px/1.6 Georgia,serif;color:${T.acc};margin:0 0 16px">${esc(T.frase)}</p>
<p style="line-height:1.7;font-size:15px;margin:0 0 6px">«${esc(r.title)}» ya está activa. Compártela con tus invitados:</p>
${btn(inv, "Ver mi invitación", true)}
${sec("📣 Para enviar a tus invitados", "Te dejamos un mensaje listo para pegar en tu grupo de WhatsApp. La imagen para acompañarlo la descargas en tu kit.")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0"><tr><td style="background:${T.light ? "#0000000d" : "#ffffff0d"};border:1px solid ${T.acc}44;border-radius:12px;padding:14px 16px;text-align:left;color:${tx};font:14px/1.6 Arial,sans-serif;white-space:pre-wrap">${esc(msg)}</td></tr></table>
${btn(wa, "Enviar el mensaje por WhatsApp", true)}
${btn(kit, "Descargar la imagen para compartir", false)}
${sec("Tu panel privado", "Aquí ves quién confirmó, con cuántas personas y sus mensajes. No lo compartas.")}
${btn(host, "Abrir mi panel", false)}
${sec("Editar", "Puedes corregir datos (hasta 5 veces, hasta el día del evento). El enlace de tu invitación no cambia.")}
${btn(ed, "Editar mi invitación", false)}
<p style="font-size:12px;color:${tx2};margin:24px 0 0;line-height:1.6">Guarda este correo: aquí están tus enlaces. ¿Dudas? Escríbenos a <a href="mailto:soporte@poseidonmk.com" style="color:${T.acc}">soporte@poseidonmk.com</a></p>
</td></tr><tr><td style="padding:6px 28px 24px;text-align:center;font:11px Arial;color:${tx2};letter-spacing:.12em">POSEIDÓN · poseidonmk.com</td></tr></table></td></tr></table></body></html>`;
  const text = `¡Tu invitación está lista, ${r.name.split(" ")[0]}!\n\n«${r.title}»\n\nVer mi invitación: ${inv}\n\nMENSAJE PARA TUS INVITADOS (copia y pega):\n${msg}\n\nImagen para compartir: ${kit}\nTu panel privado (no lo compartas): ${host}\nEditar (hasta 5 veces, hasta el día del evento): ${ed}\n\nSoporte: soporte@poseidonmk.com`;
  await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": BREVO, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Poseidón · Invitaciones", email: "no-reply@poseidonmk.com" }, replyTo: { email: "soporte@poseidonmk.com" }, to: [{ email: r.email, name: r.name }], subject: `Tu invitación «${r.title}» está lista`, htmlContent: html, textContent: text }) }).catch(() => {});
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode(pre = "INS") { const b = crypto.getRandomValues(new Uint8Array(11)); return pre + "-" + Array.from(b, (x) => ALPHA[x % ALPHA.length]).join(""); } // 15 caracteres

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "METHOD" }, 405);
  let b: any; try { b = await req.json(); } catch { return json(req, { error: "BAD_INPUT" }, 400); }
  const a = String(b.action || "");
  if (a === "pagado" || a === "crear" || a === "proforma_crear") await loadCfg();

  /* --- n8n: pago ya verificado con PayPhone --- */
  if (a === "pagado") {
    if (!SECRET || !same(req.headers.get("x-ins-secret") || "", SECRET)) return json(req, { error: "FORBIDDEN" }, 403);
    const code = String(b.code || ""), cents = Math.round(Number(b.amount_cents));
    if (/^INP-[A-Z0-9]{11}$/.test(code) && Number.isFinite(cents)) {
      const pr = await rpc("pf_paid", { p_code: code, p_tx: String(b.transaction_id || "").slice(0, 60), p_amount: cents });
      if (pr.error) return json(req, pr, pr.error === "NOT_FOUND" ? 404 : 409);
      return json(req, { ...pr, kind_proforma: true });
    }
    if (!/^INS-[A-Z0-9]{11}$/.test(code) || !Number.isFinite(cents)) return json(req, { error: "BAD_INPUT" }, 400);
    const r = await rpc("ord_paid", { p_code: code, p_tx: String(b.transaction_id || "").slice(0, 60), p_amount: cents });
    if (r.error) return json(req, r, r.error === "NOT_FOUND" ? 404 : 409);
    if (!r.already) await mailBuyer({ name: r.name, email: r.email, title: r.title, slug: r.slug, host: r.host_token, edit: r.edit_token, code, theme: r.theme });
    return json(req, { ok: true, already: !!r.already, name: r.name, phone: r.phone || "", theme: r.theme, title: r.title });
  }

  /* --- empresas: proforma con link de pago (precio SIEMPRE calculado aquí, por tramos) --- */
  if (a === "proforma_crear") {
    if (b.web) return json(req, { ok: true });
    const kind = String(b.kind || ""); const people = Math.round(Number(b.people));
    if (!["inv", "ami", "combo"].includes(kind) || !(people >= 1 && people <= (kind === "ami" ? 99 : 500))) return json(req, { error: "BAD_INPUT" }, 400);
    const company = S(b.company, 80), contact = S(b.contact, 80), phone = S(b.phone, 20).replace(/\D/g, ""), ruc = S(b.ruc, 13).replace(/\D/g, ""), email = S(b.email, 120).toLowerCase(), note = S(b.note, 300);
    if (company.length < 2 || contact.length < 2) return json(req, { error: "BAD_NAME" }, 400);
    if (!/^(09|08)\d{8}$/.test(phone)) return json(req, { error: "BAD_PHONE" }, 400);
    if (ruc && !/^(\d{10}|\d{13})$/.test(ruc)) return json(req, { error: "BAD_DOC" }, 400);
    if (email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return json(req, { error: "BAD_EMAIL" }, 400);
    if (!LINK_URL || !SECRET) return json(req, { error: "NOT_READY" }, 503);
    // Tramos: hasta 15 / 30 / 60 / 100 personas. Desde la persona 101: $0,60 c/u (invitación y combo). Centavos, antes de IVA.
    const TIERS = [15, 30, 60, 100];
    const PR: Record<string, number[]> = { inv: [1500, 2500, 3500, 4500], ami: [1200, 1900, 2500, 3500], combo: [2500, 3900, 4900, 6900] };
    const ti = TIERS.findIndex((t) => people <= t);
    const base = ti >= 0 ? PR[kind][ti] : PR[kind][3] + (people - 100) * 60;
    const iva = ivaOf(base), total = base + iva, code = newCode("INP");
    const o = await rpc("pf_create", { p_code: code, p_kind: kind, p_people: people, p_base: base, p_iva: iva, p_company: company, p_contact: contact, p_phone: phone, p_ruc: ruc, p_email: email, p_note: note });
    if (o.error) return json(req, { error: o.error === "RATE" ? "RATE" : "SERVER" }, o.error === "RATE" ? 429 : 500);
    let url = "";
    try {
      const r = await fetch(LINK_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-ins-secret": SECRET },
        body: JSON.stringify({ code, amount_cents: total, base_cents: base, iva_cents: iva, reference: `InSecret empresa ${code}`.slice(0, 60), description: `InSecret ${kind === "inv" ? "Invitación" : kind === "ami" ? "Amigo secreto" : "Combo"} empresa` }), signal: AbortSignal.timeout(20000) });
      const j = await r.json().catch(() => ({})); url = typeof j.url === "string" ? j.url : "";
    } catch { /* abajo */ }
    if (!/^https:\/\//.test(url)) return json(req, { error: "LINK" }, 502);
    await rpc("pf_set_url", { p_code: code, p_url: url });
    return json(req, { ok: true, code, url, base_cents: base, iva_cents: iva, total_cents: total });
  }
  if (a === "proforma_estado") {
    const code = String(b.code || ""); if (!/^INP-[A-Z0-9]{11}$/.test(code)) return json(req, { error: "BAD_INPUT" }, 400);
    const r = await rpc("pf_get", { p_code: code }); return json(req, r.error ? r : { ok: true, status: r.status }, r.error ? 404 : 200);
  }

  /* --- navegador --- */
  if (a === "crear") {
    if (b.web) return json(req, { ok: true }); // trampa para robots
    const theme = String(b.theme || ""); const base = PRICES[theme];
    if (!base) return json(req, { error: "BAD_THEME" }, 400);
    const name = S(b.name, 80), email = S(b.email, 120).toLowerCase(), phone = S(b.phone, 20).replace(/[^\d+]/g, ""), doc = S(b.doc, 13).replace(/\D/g, "");
    if (name.length < 2) return json(req, { error: "BAD_NAME" }, 400);
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) return json(req, { error: "BAD_EMAIL" }, 400);
    if (doc && !/^(\d{10}|\d{13})$/.test(doc)) return json(req, { error: "BAD_DOC" }, 400);
    const cc = cleanConfig(b.config); if (cc.error) return json(req, { error: cc.error }, 400);
    if (!LINK_URL || !SECRET) return json(req, { error: "NOT_READY" }, 503);
    const iva = ivaOf(base), cents = base + iva;
    const code = newCode();
    const o = await rpc("ord_create", { p_code: code, p_theme: theme, p_config: cc.cfg, p_name: name, p_email: email, p_phone: phone, p_doc: doc, p_amount: cents });
    if (o.error) return json(req, { error: o.error === "RATE" ? "RATE" : "SERVER" }, o.error === "RATE" ? 429 : 500);
    let url = "";
    try {
      const r = await fetch(LINK_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-ins-secret": SECRET },
        body: JSON.stringify({ code, amount_cents: cents, base_cents: base, iva_cents: iva, email, phone, reference: `InSecret ${NAMES[theme]} ${code}`.slice(0, 60), description: `Invitación interactiva · ${NAMES[theme]}` }), signal: AbortSignal.timeout(20000) });
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
