/* ============================================================
   QELVION Biotech · quote-form API
   Receives website enquiries (POST /api/quote) and delivers them
   by email to the salesperson the visitor came from
   (qelvionbiotech.com/steven  ->  Steven), with a copy to the
   company inbox so nothing is ever lost.

   Environment variables (set in Render → Environment):
     MAIL_FROM          e.g. orders@qelvionbiotech.com
     MAIL_FALLBACK_TO   e.g. main@qelvionbiotech.com   (company inbox)
     SMTP_HOST          smtp.fastmail.com      (option A: Fastmail)
     SMTP_PORT          465
     SMTP_USER          orders@qelvionbiotech.com
     SMTP_PASS          <Fastmail app password>
     RESEND_API_KEY     re_xxx                (option B: Resend, preferred if set)
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

/* ---------- CORS (only our own site may post) ---------- */
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const allowed = [ALLOW_ORIGIN, "https://www." + ALLOW_ORIGIN.replace(/^https?:\/\//, ""), "http://127.0.0.1:8099", "http://localhost:8099"];
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ---------- tiny in-memory rate limit + duplicate guard ---------- */
const hits = new Map();          // ip -> [timestamps]
const recent = new Map();        // email+message hash -> timestamp
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 6;         // more than 6 posts / 10 min
}
function isDuplicate(key) {
  const now = Date.now();
  const last = recent.get(key);
  recent.set(key, now);
  return last && now - last < 60 * 1000;
}

/* ---------- contacts (single source of truth = the website) ---------- */
let contactsCache = { at: 0, data: null };
async function getContacts() {
  if (contactsCache.data && Date.now() - contactsCache.at < 10 * 60 * 1000) return contactsCache.data;
  try {
    const r = await fetch(CONTACTS_URL + "?v=" + Date.now());
    const j = await r.json();
    contactsCache = { at: Date.now(), data: j };
    return j;
  } catch (e) {
    return contactsCache.data || null;
  }
}

/* ---------- mail transport ---------- */
let smtpTransport = null;
function transport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.fastmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return smtpTransport;
}

async function sendMail({ to, cc, replyTo, subject, text }) {
  /* Resend first (if configured), otherwise SMTP (Fastmail) */
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: MAIL_FROM, to: [to].concat(cc ? [cc] : []), reply_to: replyTo, subject, text })
    });
    if (!r.ok) throw new Error("Resend " + r.status + ": " + (await r.text()).slice(0, 200));
    return "resend";
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("no mail transport configured (set RESEND_API_KEY or SMTP_USER/SMTP_PASS)");
  }
  await transport().sendMail({ from: MAIL_FROM, to, cc, replyTo, subject, text });
  return "smtp";
}

/* ---------- helpers ---------- */
const clean = (v, max) => String(v == null ? "" : v).replace(/\r/g, "").trim().slice(0, max || 400);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ---------- routes ---------- */
app.get("/", (_req, res) => res.type("text/plain").send("QELVION quote API is running."));
app.get("/health", (_req, res) => res.json({ ok: true, transport: process.env.RESEND_API_KEY ? "resend" : (process.env.SMTP_USER ? "smtp" : "none") }));

app.post("/api/quote", async (req, res) => {
  try {
    const b = req.body || {};
    if (clean(b.company_website)) return res.json({ ok: true });           // honeypot filled -> pretend success
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    if (limited(ip)) return res.status(429).json({ ok: false, error: "Too many requests, please try again later." });

    const name = clean(b.name, 120);
    const org = clean(b.org, 160);
    const email = clean(b.email, 160);
    const type = clean(b.type, 120);
    const message = clean(b.message, 4000);
    const repSlug = clean(b.rep, 40).toLowerCase();
    const page = clean(b.page, 300);

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
      "Name:        " + name + "\n" +
      "Organization:" + (org || " -") + "\n" +
      "Email:       " + email + "\n" +
      "Type:        " + (type || " -") + "\n" +
      (person ? ("Assigned to: " + person.name + " (" + person.email + ")\n") : "Assigned to: company inbox\n") +
      "Page:        " + (page || " -") + "\n" +
      "Time:        " + when + "\n" +
      "IP:          " + ip + "\n" +
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

app.listen(PORT, () => console.log("QELVION quote API listening on " + PORT));
