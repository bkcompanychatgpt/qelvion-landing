/* ============================================================
   QELVION Biotech · quote-form API
   Receives website enquiries (POST /api/quote) and delivers them
   by email to the salesperson the visitor came from
   (qelvionbiotech.com/steven  ->  Steven), with a copy to the
   company inbox so nothing is ever lost.

   Sending back-ends (first one configured wins):
     1. Fastmail JMAP over HTTPS  -> FASTMAIL_API_TOKEN   (recommended:
        Render blocks outbound SMTP ports 25/465/587)
     2. Resend HTTP API           -> RESEND_API_KEY
     3. SMTP (only works where outbound SMTP is allowed) -> SMTP_*

   Other environment variables:
     MAIL_FROM          orders@qelvionbiotech.com
     MAIL_FALLBACK_TO   main@qelvionbiotech.com
     ALLOW_ORIGIN       https://qelvionbiotech.com
     CONTACTS_URL       https://qelvionbiotech.com/assets/contacts.json
   ============================================================ */
"use strict";

const express = require("express");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 10000;
const MAIL_FROM = process.env.MAIL_FROM || "orders@qelvionbiotech.com";
const FALLBACK_TO = process.env.MAIL_FALLBACK_TO || "main@qelvionbiotech.com";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "https://qelvionbiotech.com";
const CONTACTS_URL = process.env.CONTACTS_URL || "https://qelvionbiotech.com/assets/contacts.json";

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

/* ---------- CORS ---------- */
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const host = ALLOW_ORIGIN.replace(/^https?:\/\//, "");
  const allowed = [ALLOW_ORIGIN, "https://www." + host, "http://127.0.0.1:8099", "http://localhost:8099"];
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ---------- rate limit + duplicate guard ---------- */
const hits = new Map();
const recent = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 6;
}
function isDuplicate(key) {
  const now = Date.now(); const last = recent.get(key); recent.set(key, now);
  return last && now - last < 60 * 1000;
}

/* ---------- contacts ---------- */
let contactsCache = { at: 0, data: null };
async function getContacts() {
  if (contactsCache.data && Date.now() - contactsCache.at < 10 * 60 * 1000) return contactsCache.data;
  try {
    const r = await fetch(CONTACTS_URL + "?v=" + Date.now());
    const j = await r.json();
    contactsCache = { at: Date.now(), data: j };
    return j;
  } catch (e) { return contactsCache.data || null; }
}

/* ============================================================
   1) Fastmail JMAP (HTTPS)
   ============================================================ */
let jmapCache = { at: 0, session: null };
async function jmapSession() {
  if (jmapCache.session && Date.now() - jmapCache.at < 30 * 60 * 1000) return jmapCache.session;
  const r = await fetch("https://api.fastmail.com/jmap/session", {
    headers: { Authorization: "Bearer " + process.env.FASTMAIL_API_TOKEN }
  });
  if (!r.ok) throw new Error("JMAP session " + r.status);
  const j = await r.json();
  const accountId = (j.primaryAccounts && j.primaryAccounts["urn:ietf:params:jmap:mail"]) || Object.keys(j.accounts)[0];
  const session = { apiUrl: j.apiUrl, accountId, username: j.username };
  jmapCache = { at: Date.now(), session };
  return session;
}
async function jmapCall(methodCalls) {
  const s = await jmapSession();
  const r = await fetch(s.apiUrl, {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.FASTMAIL_API_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail", "urn:ietf:params:jmap:submission"], methodCalls })
  });
  const j = await r.json();
  if (!r.ok) throw new Error("JMAP call " + r.status + " " + JSON.stringify(j).slice(0, 200));
  const bad = (j.methodResponses || []).find((m) => m[0].endsWith("/error"));
  if (bad) throw new Error("JMAP " + bad[0] + ": " + JSON.stringify(bad[1]).slice(0, 200));
  return j.methodResponses;
}
async function sendViaJmap({ to, cc, replyTo, subject, text }) {
  const s = await jmapSession();
  const acc = s.accountId;
  const [mbRes] = await jmapCall([["Mailbox/get", { accountId: acc, ids: null }, "m"]]);
  const mailboxes = (mbRes[1].list || []);
  const drafts = mailboxes.find((m) => m.role === "drafts") || mailboxes[0];
  const [idRes] = await jmapCall([["Identity/get", { accountId: acc, ids: null }, "i"]]);
  const identities = (idRes[1].list || []);
  const fromEmail = MAIL_FROM.toLowerCase();
  const identity = identities.find((i) => (i.email || "").toLowerCase() === fromEmail) || identities[0];
  if (!identity) throw new Error("no sending identity found for " + MAIL_FROM);

  const draft = {
    mailboxIds: { [drafts.id]: true },
    keywords: { $draft: true },
    from: [{ name: "Qelvion Biotech Orders", email: MAIL_FROM }],
    to: [{ email: to }],
    subject,
    bodyValues: { body: { value: text } },
    textBody: [{ partId: "body", type: "text/plain" }]
    /* note: Fastmail JMAP rejects custom headers on Email/set, so none are added */
  };
  if (cc) draft.cc = [{ email: cc }];
  if (replyTo) draft.replyTo = [{ email: replyTo }];

  const sent = mailboxes.find((m) => m.role === "sent");
  const onSuccess = {};
  if (sent) {
    onSuccess["#sub"] = {
      ["mailboxIds/" + drafts.id]: null,
      ["mailboxIds/" + sent.id]: true,
      "keywords/$draft": null
    };
  }
  const rs = await jmapCall([
    ["Email/set", { accountId: acc, create: { draft } }, "e"],
    ["EmailSubmission/set", {
      accountId: acc,
      create: { sub: { identityId: identity.id, emailId: "#draft" } },
      onSuccessUpdateEmail: onSuccess
    }, "s"]
  ]);
  const created = rs[0][1].created && rs[0][1].created.draft;
  const submitted = rs[1][1].created && rs[1][1].created.sub;
  if (!created || !submitted) throw new Error("JMAP submit failed: " + JSON.stringify(rs).slice(0, 250));
  return "jmap";
}

/* ============================================================
   2) Resend (HTTPS)
   ============================================================ */
async function sendViaResend({ to, cc, replyTo, subject, text }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to: [to].concat(cc ? [cc] : []), reply_to: replyTo, subject, text })
  });
  if (!r.ok) throw new Error("Resend " + r.status + ": " + (await r.text()).slice(0, 200));
  return "resend";
}

/* ============================================================
   3) SMTP (may be blocked on some hosts)
   ============================================================ */
let smtpTransport = null;
async function sendViaSmtp({ to, cc, replyTo, subject, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP not configured");
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.fastmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15000, greetingTimeout: 10000
    });
  }
  await smtpTransport.sendMail({ from: MAIL_FROM, to, cc, replyTo, subject, text });
  return "smtp";
}

async function sendMail(msg) {
  if (process.env.FASTMAIL_API_TOKEN) return await sendViaJmap(msg);
  if (process.env.RESEND_API_KEY) return await sendViaResend(msg);
  return await sendViaSmtp(msg);
}
function transportName() {
  if (process.env.FASTMAIL_API_TOKEN) return "fastmail-jmap";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_USER) return "smtp";
  return "none";
}

/* ---------- helpers ---------- */
const clean = (v, max) => String(v == null ? "" : v).replace(/\r/g, "").trim().slice(0, max || 400);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ---------- routes ---------- */
app.get("/", (_req, res) => res.type("text/plain").send("QELVION quote API is running."));
app.get("/health", (_req, res) => res.json({ ok: true, transport: transportName() }));

app.post("/api/quote", async (req, res) => {
  try {
    const b = req.body || {};
    if (clean(b.company_website)) return res.json({ ok: true });            // honeypot
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    if (limited(ip)) return res.status(429).json({ ok: false, error: "Too many requests, please try again later." });

    const name = clean(b.name, 120), org = clean(b.org, 160), email = clean(b.email, 160);
    const type = clean(b.type, 120), message = clean(b.message, 4000);
    const repSlug = clean(b.rep, 40).toLowerCase(), page = clean(b.page, 300);

    if (!name || !email || !message) return res.status(400).json({ ok: false, error: "Name, email and message are required." });
    if (!isEmail(email)) return res.status(400).json({ ok: false, error: "Please provide a valid email address." });
    if (isDuplicate((email + "|" + message).toLowerCase())) return res.json({ ok: true, duplicate: true });

    const contacts = await getContacts();
    const sales = (contacts && contacts.sales) || [];
    const person = sales.find((p) => p.slug === repSlug) || null;
    const mainEmail = (contacts && contacts.main && contacts.main.email) || FALLBACK_TO;
    const to = person && person.email ? person.email : mainEmail;
    const cc = person && person.email ? mainEmail : undefined;

    const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const subject = "[Website quote] " + name + (org ? " · " + org : "") + (person ? " · " + person.name : " · main");
    const text =
      "New enquiry from the website\n" +
      "================================\n" +
      "Name:         " + name + "\n" +
      "Organization: " + (org || " -") + "\n" +
      "Email:        " + email + "\n" +
      "Type:         " + (type || " -") + "\n" +
      (person ? ("Assigned to:  " + person.name + " (" + person.email + ")\n") : "Assigned to:  company inbox\n") +
      "Page:         " + (page || " -") + "\n" +
      "Time:         " + when + "\n" +
      "IP:           " + ip + "\n" +
      "================================\n\n" +
      "Message:\n" + message + "\n\n" +
      "--\nReply directly to this email to answer the customer.\n";

    const used = await sendMail({ to, cc, replyTo: email, subject, text });
    console.log("quote delivered via " + used + " -> " + to + (cc ? " cc " + cc : ""));
    return res.json({ ok: true, deliveredTo: person ? person.name : "main", transport: used });
  } catch (e) {
    console.error("quote error:", e.message);
    return res.status(500).json({ ok: false, error: "Could not send your request. Please email us directly." });
  }
});

app.listen(PORT, () => console.log("QELVION quote API listening on " + PORT + " · transport=" + transportName()));
