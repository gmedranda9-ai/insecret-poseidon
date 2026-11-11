import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE = "https://insecret.poseidonmk.com";
const ALLOW = ["https://insecret.poseidonmk.com", "http://localhost:8123"];
const SB = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return { "Access-Control-Allow-Origin": ALLOW.includes(o) ? o : ALLOW[0], "Access-Control-Allow-Headers": "content-type, authorization, apikey", "Vary": "Origin" };
}
const json = (req: Request, o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors(req), "Content-Type": "application/json" } });
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const okColor = (c: unknown) => (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#0b5d3b");
const okEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;

async function rpc(fn: string, body: unknown) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return await r.json().catch(() => ({}));
}

const nice = (n: string) => { const w = n.replace(/\s+/g, " ").trim(); return w === w.toUpperCase() || w === w.toLowerCase() ? w.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : w; };

function mail(o: { company: string; name: string; title: string; accent: string; sign: string; intro?: string; inv?: string; ss?: string; when?: string; banner: string }) {
  const first = esc(nice(o.name).split(" ")[0]);
  const gold = "#e3c27a";
  const btn = (href: string, label: string, solid: boolean) =>
    `<a href="${esc(href)}" style="display:block;text-align:center;text-decoration:none;font:700 16px Arial,sans-serif;padding:15px 18px;border-radius:999px;margin:12px 0;${solid ? `background:${gold};color:#1a1405;` : `border:2px solid ${gold};color:${gold};`}">${label}</a>`;
  const text = o.intro
    ? esc(o.intro).replace(/\n/g, "<br>")
    : `${o.inv ? `Te invitamos a <b style="color:#fff">${esc(o.title)}</b>${o.when ? `<br><span style="color:${gold}">${esc(o.when)}</span>` : ""}.` : ""}${o.ss ? `<br>${o.inv ? "Además, este año hay" : "Este año hay"} <b style="color:#fff">amigo secreto</b>.` : ""}`;
  return `<!doctype html><html><body style="margin:0;background:#060b16;padding:22px 10px;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#0b1220;border-radius:18px;overflow:hidden;border:1px solid rgba(227,194,122,.35)"><tr><td style="padding:0;line-height:0"><img src="${o.banner}" width="560" alt="" style="display:block;width:100%;height:auto;border:0"></td></tr><tr><td style="padding:6px 0;background:${o.accent}"></td></tr><tr><td style="padding:30px 28px 26px;color:#f6f1e4">
<div style="font:700 12px Arial;letter-spacing:.3em;text-transform:uppercase;color:${gold};text-align:center">${esc(o.company)}</div>
<h2 style="margin:14px 0 12px;font:700 28px Georgia,serif;text-align:center;color:#f3dfae">Hola, ${first}</h2>
<p style="line-height:1.7;font-size:16px;margin:0 0 14px;text-align:center;color:#e9e4d6">${text}</p>
${o.inv ? btn(o.inv, "Ver mi invitación y confirmar", true) : ""}${o.ss ? btn(o.ss, "🎁 Descubrir mi amigo secreto", !o.inv) : ""}
<p style="font-size:12px;color:#8f99ab;margin:12px 0 0;text-align:center">${o.ss ? "El enlace del amigo secreto es solo tuyo. No lo compartas." : ""}</p>
${o.sign ? `<p style="border-top:1px solid rgba(227,194,122,.25);margin-top:22px;padding-top:16px;font:italic 15px Georgia,serif;color:${gold};text-align:center">${esc(o.sign).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr><tr><td style="padding:14px 20px;background:#080d18;text-align:center;font:12px Arial;color:#7f8aa0"><img src="https://insecret.poseidonmk.com/assets/logo.png" width="22" height="22" alt="" style="vertical-align:middle;border-radius:50%"> &nbsp;Hecho por <a href="https://poseidonmk.com" style="color:#9fb4c9;text-decoration:none">Poseidón</a></td></tr></table></body></html>`;
}

async function send(key: string, to: { email: string; name: string }, subject: string, html: string, company: string) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: `${company} · Poseidón`.slice(0, 60), email: "no-reply@poseidonmk.com" }, replyTo: { email: "soporte@poseidonmk.com" }, to: [to], subject, htmlContent: html }),
  });
  if (r.ok) return null;
  const t = await r.text().catch(() => "");
  return `${r.status} ${t.slice(0, 120)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "METHOD" }, 405);
  const BREVO = (Deno.env.get("BREVO_API_KEY") || "").trim();
  let b: any; try { b = await req.json(); } catch { return json(req, { error: "BAD_INPUT" }, 400); }

  const gate = await rpc("admin_list", { p_key: String(b.key || "") });
  if (gate.error || gate.message) return json(req, { error: gate.error || "BAD_KEY" });
  if (!BREVO) return json(req, { error: "NO_BREVO_KEY" });
  if (!BREVO.startsWith("xkeysib-")) return json(req, { error: "BREVO_KEY_FORMAT" });

  const people: any[] = Array.isArray(b.people) ? b.people : [];
  if (people.length < 1 || people.length > 100) return json(req, { error: "BAD_COUNT" });
  const clean = people.map((p) => ({ name: String(p.name || "").replace(/\s+/g, " ").trim(), email: String(p.email || "").trim().toLowerCase(), token: p.token ? String(p.token) : "" }));
  const badEmail = clean.find((p) => !okEmail(p.email));
  if (badEmail) return json(req, { error: "BAD_EMAIL", who: badEmail.name || badEmail.email });

  const company = String(b.company || "").trim().slice(0, 50) || "Tu empresa";
  const accent = okColor(b.accent);
  const sign = String(b.sign || "").slice(0, 160);
  const intro = String(b.intro || "").trim().slice(0, 300);
  const slug = String(b.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const withSS = !!b.withSecret;

  let title = "nuestro evento", when = "", theme = "navidad";
  if (slug) {
    const inv = await rpc("invite_get", { p_slug: slug });
    if (inv.message || inv.error) return json(req, { error: "INVITE_NOT_FOUND" });
    title = inv.config?.title || title; theme = ["navidad", "fin", "boda", "cumple", "cita"].includes(inv.theme) ? inv.theme : "navidad";
    try { when = new Date(inv.config?.date + "-05:00").toLocaleString("es-EC", { timeZone: "America/Guayaquil", dateStyle: "full", timeStyle: "short" }); } catch { /* */ }
  }

  const tokens: Record<string, string> = {}; let group: string | null = null, org: string | null = null;
  const resend = withSS && clean.every((p) => p.token);
  if (withSS && !resend) {
    const d = await rpc("admin_company_draw", { p_key: String(b.key), p_group: company, p_organizer: String(b.organizer || company).slice(0, 40), p_event_date: b.eventDate, p_budget: Number(b.budget) || 0, p_message: String(b.message || ""), p_names: clean.map((p) => p.name) });
    if (d.error || d.message) return json(req, { error: d.error || "DRAW_FAILED", detail: d.name || d.at || d.message || null });
    group = d.group_token; org = d.org_token;
    for (const p of d.participants) tokens[p.name.toLowerCase()] = p.token;
  } else if (resend) { for (const p of clean) tokens[p.name.toLowerCase()] = p.token; }

  const results: any[] = []; let i = 0;
  async function worker() {
    while (i < clean.length) {
      const p = clean[i++]; const tk = tokens[p.name.toLowerCase()] || "";
      const inv = slug ? `${SITE}/invitacion/?i=${slug}&para=${encodeURIComponent(nice(p.name))}` : undefined;
      const ss = withSS && tk ? `${SITE}/amigo-secreto/?t=${tk}&e=1` : undefined;
      const subj = `${nice(p.name).split(" ")[0]}, ${slug ? `te invitamos a ${title}` : "tu amigo secreto está listo"}`;
      const err = await send(BREVO, { email: p.email, name: p.name }, subj, mail({ company, name: p.name, title, accent, sign, intro, inv, ss, when, banner: `${SITE}/assets/mail/${theme}.jpg` }), company);
      results.push({ name: p.name, email: p.email, token: tk, ok: !err, error: err });
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  results.sort((a, c) => a.name.localeCompare(c.name));
  return json(req, { ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, group_token: group, org_token: org, results });
});
