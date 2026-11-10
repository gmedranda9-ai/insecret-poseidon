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

function mail(o: { company: string; name: string; title: string; accent: string; sign: string; intro?: string; inv?: string; ss?: string; when?: string }) {
  const first = esc(o.name.split(" ")[0]);
  const btn = (href: string, label: string, solid: boolean) =>
    `<a href="${esc(href)}" style="display:block;text-align:center;text-decoration:none;font:600 16px Arial,sans-serif;padding:14px 18px;border-radius:999px;margin:10px 0;${solid ? `background:${o.accent};color:#fff;` : `border:2px solid ${o.accent};color:${o.accent};background:#fff;`}">${label}</a>`;
  const text = o.intro
    ? esc(o.intro).replace(/\n/g, "<br>")
    : `${o.inv ? `Te invitamos a <b>${esc(o.title)}</b>${o.when ? ` — ${esc(o.when)}` : ""}.` : ""}${o.ss ? ` ${o.inv ? "Además, este año hay" : "Este año hay"} <b>amigo secreto</b>.` : ""}`;
  return `<!doctype html><html><body style="margin:0;background:#f1f4f8;padding:24px 12px;font-family:Arial,sans-serif;color:#1b2430"><table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="padding:6px;background:${o.accent}"></td></tr><tr><td style="padding:24px 22px">
<div style="font:700 15px Arial;color:${o.accent};margin-bottom:10px">${esc(o.company)}</div>
<h2 style="margin:0 0 10px;font-size:22px">Hola, ${first} 👋</h2>
<p style="line-height:1.55;font-size:16px;margin:0 0 8px">${text}</p>
${o.inv ? btn(o.inv, "Ver mi invitación y confirmar", true) : ""}${o.ss ? btn(o.ss, "🎁 Descubrir mi amigo secreto", !o.inv) : ""}
<p style="font-size:13px;color:#7b8794;margin:10px 0 0">${o.ss ? "El enlace del amigo secreto es solo tuyo. No lo compartas." : ""}</p>
${o.sign ? `<p style="border-top:1px solid #e4e9ef;margin-top:16px;padding-top:12px;font-size:14px;color:#3a4654">${esc(o.sign).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr></table></body></html>`;
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

  let title = "nuestro evento", when = "";
  if (slug) {
    const inv = await rpc("invite_get", { p_slug: slug });
    if (inv.message || inv.error) return json(req, { error: "INVITE_NOT_FOUND" });
    title = inv.config?.title || title;
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
      const inv = slug ? `${SITE}/invitacion/?i=${slug}&para=${encodeURIComponent(p.name)}` : undefined;
      const ss = withSS && tk ? `${SITE}/amigo-secreto/?t=${tk}` : undefined;
      const subj = `${p.name.split(" ")[0]}, ${slug ? `te invitamos a ${title}` : "tu amigo secreto está listo"}`;
      const err = await send(BREVO, { email: p.email, name: p.name }, subj, mail({ company, name: p.name, title, accent, sign, intro, inv, ss, when }), company);
      results.push({ name: p.name, email: p.email, token: tk, ok: !err, error: err });
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  results.sort((a, c) => a.name.localeCompare(c.name));
  return json(req, { ok: true, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, group_token: group, org_token: org, results });
});
