/* ============================================================
   QELVION Biotech · sales-context + contact popup
   Loaded on EVERY page of the site.
   ------------------------------------------------------------
   1) Remembers which salesperson a visitor arrived from
      (qelvionbiotech.com/steven · ?s=steven · meta[qv-sales])
      and keeps it for 180 days (localStorage).
   2) On EVERY page while that assignment is active:
        · floating WhatsApp button -> that salesperson's direct link
        · email buttons            -> that salesperson's email address
        · "✉ Contact us" button    -> popup (main + that salesperson)
        · internal links           -> carry ?s=<slug>, so forwarded
                                      links keep the same assignment
   3) The popup opens by itself on home-type pages; on other pages it
      opens when the visitor taps "✉ Contact us".
   Data source: assets/contacts.json  (edit there to change people)
   ============================================================ */
(function () {
  "use strict";
  var DATA_URL = "assets/contacts.json";
  var STORE_KEY = "qv_sales_ctx";
  var TTL_MS = 180 * 24 * 60 * 60 * 1000; /* 180 days */
  var DISMISS_MAIN = "qv_contact_dismissed_v1";

  /* ---------------- identity: read + persist ---------------- */
  function slugFromUrl() {
    try {
      var meta = document.querySelector('meta[name="qv-sales"]');
      if (meta && meta.content && meta.content.trim()) return meta.content.trim().toLowerCase();
      var q = new URLSearchParams(location.search).get("s");
      if (q && q.trim()) return q.trim().toLowerCase();
      var seg = location.pathname.replace(/\/+$/, "").split("/").pop() || "";
      seg = seg.replace(/\.html?$/i, "").toLowerCase();
      if (seg && seg !== "index" && seg !== "index-light") return seg;
    } catch (e) {}
    return "";
  }
  function slugFromStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return "";
      var o = JSON.parse(raw);
      if (!o || !o.slug) return "";
      if (o.ts && (Date.now() - o.ts) > TTL_MS) { localStorage.removeItem(STORE_KEY); return ""; }
      return String(o.slug).toLowerCase();
    } catch (e) { return ""; }
  }
  function saveSlug(slug) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ slug: slug, ts: Date.now() })); } catch (e) {}
  }
  function dismissKey(slug) { return slug ? ("qv_contact_dismissed_" + slug) : DISMISS_MAIN; }
  function isHomePage() {
    var p = location.pathname || "/";
    if (p === "" || p === "/" || /\/$/.test(p)) return true;
    return /\/index(-light)?\.html$/i.test(p);
  }

  /* ---------------- styles ---------------- */
  var css = document.createElement("style");
  css.textContent = [
    ".qv-ov{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;padding:18px;",
    "background:rgba(2,5,11,.55);backdrop-filter:blur(14px) saturate(115%);-webkit-backdrop-filter:blur(14px) saturate(115%);",
    "opacity:0;pointer-events:none;transition:opacity .28s ease}",
    ".qv-ov.on{opacity:1;pointer-events:auto}",
    ".qv-card{position:relative;width:100%;max-width:560px;max-height:88vh;overflow:auto;",
    "background:linear-gradient(180deg,#0B1526,#070F1C);border:1px solid rgba(147,179,231,.26);border-radius:20px;",
    "box-shadow:0 40px 90px -30px rgba(0,0,0,.9);padding:24px 22px 20px;transform:translateY(14px) scale(.98);transition:transform .3s cubic-bezier(.2,.8,.3,1.1)}",
    ".qv-ov.on .qv-card{transform:none}",
    ".qv-head{display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid rgba(147,179,231,.18)}",
    ".qv-head b{font-family:var(--sora,'Sora',sans-serif);font-size:18px;display:block;line-height:1.2}",
    ".qv-head small{display:block;font-size:11px;letter-spacing:.24em;color:#23D6A4;font-family:var(--mono,monospace);margin-top:3px}",
    ".qv-sec{margin-top:16px}",
    ".qv-sec h4{margin:0 0 10px;font-family:var(--mono,monospace);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#4DE1FF;font-weight:600}",
    ".qv-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;",
    "border:1px solid rgba(147,179,231,.18);border-radius:14px;padding:12px 14px;margin-bottom:9px;background:rgba(255,255,255,.02)}",
    ".qv-row.person{border-color:rgba(35,214,164,.4);background:linear-gradient(180deg,rgba(35,214,164,.08),rgba(255,255,255,.02))}",
    ".qv-who{min-width:150px;flex:1}",
    ".qv-who b{font-size:15.5px}",
    ".qv-who span{display:block;font-size:12.5px;color:#9FB2CF;margin-top:2px;word-break:break-all}",
    ".qv-btns{display:flex;gap:8px;flex-wrap:wrap}",
    ".qv-btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--sora,'Sora',sans-serif);font-weight:700;font-size:13px;",
    "border-radius:10px;padding:9px 14px;border:1px solid transparent;text-decoration:none;white-space:nowrap}",
    ".qv-btn.mail{background:rgba(255,255,255,.05);border-color:rgba(147,179,231,.3);color:#EAF3FF}",
    ".qv-btn.mail:hover{border-color:#4DE1FF}",
    ".qv-btn.wa{background:linear-gradient(145deg,#2BE06F,#1EBE5D);color:#03130A}",
    ".qv-btn.wa:hover{filter:brightness(1.06)}",
    ".qv-foot{margin-top:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between}",
    ".qv-ok{background:linear-gradient(100deg,#4DE1FF,#23D6A4);color:#02101C;border:none;border-radius:12px;padding:12px 26px;",
    "font-family:var(--sora,'Sora',sans-serif);font-weight:700;font-size:14.5px;cursor:pointer}",
    ".qv-note{font-size:11px;color:#6E85A6;line-height:1.6;max-width:34ch}",
    ".qv-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:10px;border:1px solid rgba(147,179,231,.3);",
    "background:rgba(255,255,255,.04);color:#EAF3FF;font-size:17px;line-height:1;cursor:pointer}",
    "body.qv-lock{overflow:hidden}",
    ".qv-open{position:fixed;right:22px;bottom:150px;z-index:120;display:none;align-items:center;gap:8px;",
    "background:rgba(8,16,30,.92);border:1px solid rgba(147,179,231,.32);color:#EAF3FF;border-radius:14px;padding:11px 15px;",
    "font-family:var(--sora,'Sora',sans-serif);font-weight:700;font-size:13.5px;cursor:pointer;backdrop-filter:blur(8px)}",
    ".qv-open.on{display:inline-flex}",
    "@media(max-width:760px){.qv-card{max-height:92vh;padding:20px 16px 16px}.qv-open{bottom:142px;right:16px;padding:10px 13px}}"
  ].join("");
  document.head.appendChild(css);

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- apply the assignment to the page ---------------- */
  function applyIdentity(data, person) {
    var link = person ? person.whatsappLink : data.main.whatsappLink;

    /* 1) floating WhatsApp button (guard stops the settings loader
          from overwriting it back to the company number) */
    function setWa() {
      var wa = document.getElementById("waFloat");
      if (!wa) return;
      wa.dataset.qvSet = "1";
      wa.href = link;
      wa.setAttribute("aria-label", (person ? ("Chat with " + person.name) : "Chat with QELVION Biotech") + " on WhatsApp");
      if (person) wa.title = "Chat with " + person.name + " on WhatsApp";
    }
    setWa();
    [500, 1200, 2000, 3200, 5000, 8000].forEach(function (t) { setTimeout(setWa, t); });
    window.addEventListener("load", function () { setTimeout(setWa, 300); });
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("#waFloat") : null;
      if (a) setWa();
    }, true);

    /* 2) email buttons follow the assigned salesperson */
    function fixMail() {
      var target = person ? person.email : data.main.email;
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        var href = a.getAttribute("href") || "";
        var addr = href.replace(/^mailto:/i, "").split("?")[0];
        if (/quote@qelvionbiotech\.com/i.test(addr) || (person && /qelvionbiotech@gmail\.com|salesqelvion\d*@/i.test(addr))) {
          if (addr.toLowerCase() !== target.toLowerCase()) {
            a.setAttribute("href", href.replace(addr, target));
            var t = (a.textContent || "").trim();
            if (/@/.test(t) && /qelvionbiotech|salesqelvion/i.test(t)) a.textContent = t.replace(/\S+@\S+/, target);
          }
        }
      });
    }
    fixMail();
    setTimeout(fixMail, 1200);
    setTimeout(fixMail, 3000);
    setTimeout(fixMail, 6000);

    /* 3) keep the assignment when moving around the site */
    if (person) {
      function decorate() {
        document.querySelectorAll("a[href]").forEach(function (a) {
          var h = a.getAttribute("href");
          if (!h || /^(#|mailto:|tel:|javascript:|\/\/|https?:)/i.test(h)) return;
          if (!/\.html(\?|#|$)/i.test(h) && !/^\.?\/$/.test(h)) return;
          if (/[?&]s=/.test(h)) return;
          var parts = h.split("#");
          a.setAttribute("href", parts[0] + (parts[0].indexOf("?") >= 0 ? "&" : "?") + "s=" + person.slug + (parts[1] ? ("#" + parts[1]) : ""));
        });
      }
      decorate();
      setTimeout(decorate, 1200);
      setTimeout(decorate, 3500);
    }
  }

  /* ---------------- popup ---------------- */
  function salesRow(p, highlight) {
    return '<div class="qv-row' + (highlight ? " person" : "") + '">' +
      '<div class="qv-who"><b>' + esc(p.name) + '</b>' +
      '<span>' + esc(p.email) + '</span><span>WhatsApp ' + esc(p.whatsappDisplay) + '</span></div>' +
      '<div class="qv-btns">' +
      '<a class="qv-btn mail" href="mailto:' + esc(p.email) + '">✉ Email</a>' +
      '<a class="qv-btn wa" href="' + esc(p.whatsappLink) + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '</div></div>';
  }
  function build(data, person) {
    var ov = document.createElement("div");
    ov.className = "qv-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "QELVION Biotech contact information");
    var m = data.main;
    var html = '<div class="qv-card">' +
      '<button class="qv-x" aria-label="Close">✕</button>' +
      '<div class="qv-head">' +
      '<svg width="38" height="38" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 22 164.6 61 164.6 139 100 178 35.4 139 35.4 61Z" fill="none" stroke="#38D9F0" stroke-width="9"/><path d="M100 54C134 76 134 124 100 146" fill="none" stroke="#1FD6A4" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="100" r="10" fill="#38D9F0"/></svg>' +
      '<div><b>' + esc(data.brand) + '</b><small>CONTACT US</small></div></div>' +
      '<div class="qv-sec"><h4>QELVION Biotech — Main</h4>' +
      '<div class="qv-row person"><div class="qv-who"><b>' + esc(m.label) + '</b>' +
      '<span>' + esc(m.email) + '</span><span>WhatsApp ' + esc(m.whatsappDisplay) + '</span></div>' +
      '<div class="qv-btns"><a class="qv-btn mail" href="mailto:' + esc(m.email) + '">✉ Email</a>' +
      '<a class="qv-btn wa" href="' + esc(m.whatsappLink) + '" target="_blank" rel="noopener">WhatsApp</a></div></div></div>';
    if (person) {
      html += '<div class="qv-sec"><h4>Your sales contact</h4>' + salesRow(person, true) + '</div>';
    } else {
      html += '<div class="qv-sec"><h4>Sales team</h4>' + data.sales.map(function (p) { return salesRow(p, false); }).join("") + '</div>';
    }
    html += '<div class="qv-foot"><button class="qv-ok">Continue to website</button>' +
      '<div class="qv-note">Products are for laboratory research &amp; development use only — not for human or veterinary use.</div></div></div>';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    return ov;
  }

  /* ---------------- boot ---------------- */
  fetch(DATA_URL + "?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.main) return;
      /* only accept slugs that really exist in contacts.json, otherwise a
         page name such as "about" / "catalog" would be mistaken for a
         salesperson and overwrite the visitor's real assignment */
      var valid = {};
      (data.sales || []).forEach(function (p) { valid[p.slug] = 1; });
      var urlSlug = slugFromUrl();
      var slug = "";
      if (urlSlug && valid[urlSlug]) { saveSlug(urlSlug); slug = urlSlug; }
      else { slug = slugFromStore(); if (slug && !valid[slug]) slug = ""; }
      var person = (data.sales || []).filter(function (p) { return p.slug === slug; })[0] || null;
      var key = dismissKey(person ? person.slug : "");

      applyIdentity(data, person);

      var ov = build(data, person);
      function openOv() { ov.classList.add("on"); document.body.classList.add("qv-lock"); }
      function closeOv() {
        ov.classList.remove("on"); document.body.classList.remove("qv-lock");
        try { localStorage.setItem(key, "1"); } catch (e) {}
        var rb = document.getElementById("qvOpenBtn"); if (rb) rb.classList.add("on");
      }
      ov.addEventListener("click", function (e) { if (e.target === ov) closeOv(); });
      ov.querySelector(".qv-x").addEventListener("click", closeOv);
      ov.querySelector(".qv-ok").addEventListener("click", closeOv);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeOv(); });

      var rb = document.createElement("button");
      rb.id = "qvOpenBtn";
      rb.className = "qv-open";
      rb.type = "button";
      rb.innerHTML = "✉ Contact us";
      rb.addEventListener("click", function () { openOv(); rb.classList.remove("on"); });
      document.body.appendChild(rb);
      window.QVOpenContact = openOv;

      var seen = false;
      try { seen = !!localStorage.getItem(key); } catch (e) {}
      if (isHomePage() && !seen) { setTimeout(openOv, 260); } else { rb.classList.add("on"); }
    })
    .catch(function () {});
})();
