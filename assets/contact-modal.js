/* ============================================================
   QELVION Biotech · contact popup (auto-loaded on the homepage)
   - Frosted-glass overlay: the page behind is blurred
   - Shows QELVION main contact on top, sales contact(s) below
   - Personalised links: qelvionbiotech.com/steven (or ?s=steven)
     show only that salesperson's card and switch the floating
     WhatsApp button to their direct link
   - Data source: assets/contacts.json  (edit there to change info)
   ============================================================ */
(function () {
  "use strict";
  var DISMISS_KEY = "qv_contact_dismissed_v1";
  var DATA_URL = "assets/contacts.json";

  /* ---------- work out which salesperson this visit belongs to ---------- */
  function currentSlug() {
    try {
      var meta = document.querySelector('meta[name="qv-sales"]');
      if (meta && meta.content) return meta.content.trim().toLowerCase();
      var q = new URLSearchParams(location.search).get("s");
      if (q) return q.trim().toLowerCase();
      var seg = location.pathname.replace(/\/+$/, "").split("/").pop() || "";
      seg = seg.replace(/\.html?$/i, "").toLowerCase();
      if (seg && seg !== "index" && seg !== "index-light") return seg;
    } catch (e) {}
    return "";
  }

  /* ---------- styles ---------- */
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

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

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
    var body = '<div class="qv-card">' +
      '<button class="qv-x" aria-label="Close">✕</button>' +
      '<div class="qv-head">' +
      '<svg width="38" height="38" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 22 164.6 61 164.6 139 100 178 35.4 139 35.4 61Z" fill="none" stroke="#38D9F0" stroke-width="9"/><path d="M100 54C134 76 134 124 100 146" fill="none" stroke="#1FD6A4" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="100" r="10" fill="#38D9F0"/></svg>' +
      '<div><b>' + esc(data.brand) + '</b><small>CONTACT US</small></div>' +
      '</div>' +
      '<div class="qv-sec"><h4>' + (person ? "QELVION Biotech — Main" : "Company contact") + '</h4>' +
      '<div class="qv-row person"><div class="qv-who"><b>' + esc(m.label) + '</b>' +
      '<span>' + esc(m.email) + '</span><span>WhatsApp ' + esc(m.whatsappDisplay) + '</span></div>' +
      '<div class="qv-btns">' +
      '<a class="qv-btn mail" href="mailto:' + esc(m.email) + '">✉ Email</a>' +
      '<a class="qv-btn wa" href="' + esc(m.whatsappLink) + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '</div></div></div>';

    if (person) {
      body += '<div class="qv-sec"><h4>Your sales contact</h4>' + salesRow(person, true) + '</div>';
    } else {
      body += '<div class="qv-sec"><h4>Sales team</h4>' + data.sales.map(function (p) { return salesRow(p, false); }).join("") + '</div>';
    }
    body += '<div class="qv-foot"><button class="qv-ok">Continue to website</button>' +
      '<div class="qv-note">Products are for laboratory research &amp; development use only — not for human or veterinary use.</div></div>' +
      '</div>';
    ov.innerHTML = body;
    document.body.appendChild(ov);
    return ov;
  }

  function open(ov) { ov.classList.add("on"); document.body.classList.add("qv-lock"); }
  function close(ov, key) {
    ov.classList.remove("on"); document.body.classList.remove("qv-lock");
    try { localStorage.setItem(key, "1"); } catch (e) {}
    var btn = document.getElementById("qvOpenBtn"); if (btn) btn.classList.add("on");
  }

  fetch(DATA_URL + "?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.main) return;
      var slug = currentSlug();
      var person = (data.sales || []).filter(function (p) { return p.slug === slug; })[0] || null;
      var key = person ? ("qv_contact_dismissed_" + person.slug) : DISMISS_KEY;

      /* floating WhatsApp button follows the context */
      var wa = document.getElementById("waFloat");
      var link = person ? person.whatsappLink : data.main.whatsappLink;
      if (wa) {
        wa.dataset.qvSet = "1";
        wa.href = link;
        wa.setAttribute("aria-label", (person ? ("Chat with " + person.name) : "Chat with QELVION Biotech") + " on WhatsApp");
      }
      /* site-wide email buttons → main company email */
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        var t = a.textContent.trim();
        if (/quote@qelvionbiotech\.com/i.test(a.getAttribute("href") || t)) {
          a.setAttribute("href", "mailto:" + data.main.email);
          if (/quote@qelvionbiotech\.com/i.test(t)) a.textContent = t.replace(/quote@qelvionbiotech\.com/gi, data.main.email);
        }
      });

      setTimeout(function(){ if (wa && wa.dataset.qvSet) wa.href = link; }, 1600);
      setTimeout(function(){ if (wa && wa.dataset.qvSet) wa.href = link; }, 3200);
      var ov = build(data, person);
      ov.addEventListener("click", function (e) { if (e.target === ov) close(ov, key); });
      ov.querySelector(".qv-x").addEventListener("click", function () { close(ov, key); });
      ov.querySelector(".qv-ok").addEventListener("click", function () { close(ov, key); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(ov, key); });

      /* reopen button */
      var rb = document.createElement("button");
      rb.id = "qvOpenBtn";
      rb.className = "qv-open";
      rb.type = "button";
      rb.innerHTML = "✉ Contact us";
      rb.addEventListener("click", function () { open(ov); rb.classList.remove("on"); });
      document.body.appendChild(rb);

      var seen = false;
      try { seen = !!localStorage.getItem(key); } catch (e) {}
      if (!seen) { setTimeout(function () { open(ov); }, 260); }
      else { rb.classList.add("on"); }
    })
    .catch(function () {});
})();
