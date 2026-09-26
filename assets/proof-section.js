/* ============================================================
   QELVION Biotech · Proof section (dispatch / quality evidence
   + customer service reviews)
   ------------------------------------------------------------
   Content source: assets/proof.json
     { "images": [ { "file": "packing-01.jpg", "caption": "..." } ],
       "reviews": [ { "text": "...", "name": "R.", "role": "research lab, Germany" } ] }
   Images live in assets/proof/ and are uploaded from /admin.html.
   The whole section stays hidden while there is no content, so the
   page never shows an empty block.
   ============================================================ */
(function () {
  "use strict";
  var HOST_ID = "proofHost";
  var DATA = "assets/proof.json";

  var css = document.createElement("style");
  css.textContent = [
    "#proofHost{display:none}",
    "#proofHost.on{display:block}",
    ".pf-head{max-width:70ch}",
    ".pf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px}",
    ".pf-tile{position:relative;border:1px solid var(--line,rgba(147,179,231,.15));border-radius:16px;overflow:hidden;cursor:zoom-in;background:rgba(255,255,255,.02)}",
    ".pf-tile img{display:block;width:100%;height:210px;object-fit:cover;transition:transform .4s ease}",
    ".pf-tile:hover img{transform:scale(1.04)}",
    ".pf-tile figcaption{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;font-size:12.5px;color:#EAF3FF;",
    "background:linear-gradient(180deg,transparent,rgba(3,7,14,.88));font-family:var(--mono,monospace);letter-spacing:.02em}",
    ".pf-reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}",
    ".pf-rev{border:1px solid var(--line,rgba(147,179,231,.15));border-radius:16px;padding:20px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015))}",
    ".pf-rev p{font-size:14.5px;color:var(--txt,#EAF3FF);line-height:1.65}",
    ".pf-rev .who{margin-top:14px;padding-top:12px;border-top:1px solid rgba(147,179,231,.15);font-size:12.5px;color:var(--mut,#A3B6D4)}",
    ".pf-rev .who b{color:var(--acc2,#23D6A4);font-weight:700}",
    ".pf-note{margin-top:16px;font-size:11.5px;color:var(--dim,#7188AB);font-family:var(--mono,monospace)}",
    ".pf-lb{position:fixed;inset:0;z-index:500;background:rgba(2,4,9,.9);display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;opacity:0;pointer-events:none;transition:opacity .25s}",
    ".pf-lb.on{opacity:1;pointer-events:auto}",
    ".pf-lb img{max-width:94vw;max-height:88vh;border-radius:14px;border:1px solid rgba(147,179,231,.3)}",
    "@media(max-width:900px){.pf-grid,.pf-reviews{grid-template-columns:1fr}.pf-tile img{height:230px}}"
  ].join("");
  document.head.appendChild(css);

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function lightbox(src) {
    var lb = document.createElement("div");
    lb.className = "pf-lb on";
    lb.innerHTML = '<img alt="" src="' + esc(src) + '">';
    lb.addEventListener("click", function () { lb.classList.remove("on"); setTimeout(function () { lb.remove(); }, 250); });
    document.body.appendChild(lb);
  }

  fetch(DATA + "?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      var images = (data.images || []).filter(function (i) { return i && i.file; });
      var reviews = (data.reviews || []).filter(function (r) { return r && r.text; });
      if (!images.length && !reviews.length) return;

      var host = document.getElementById(HOST_ID);
      if (!host) return;

      var html = '<div class="wrap"><div class="section-head pf-head">' +
        '<div class="eyebrow">Evidence</div>' +
        '<h2>Real batches. Real dispatch. Real documentation.</h2>' +
        '<p class="lead">Photos from our packing bench, quality checks and delivery confirmations sent by customers — evidence instead of promises.</p>' +
        '</div>';

      if (images.length) {
        html += '<div class="pf-grid">';
        images.forEach(function (i) {
          html += '<figure class="pf-tile" data-src="assets/proof/' + esc(i.file) + '">' +
            '<img loading="lazy" alt="" src="assets/proof/' + esc(i.file) + '">' +
            (i.caption ? '<figcaption>' + esc(i.caption) + '</figcaption>' : '') +
            '</figure>';
        });
        html += '</div>';
      }

      if (reviews.length) {
        html += '<div class="pf-reviews">';
        reviews.forEach(function (r) {
          html += '<div class="pf-rev"><p>“' + esc(r.text) + '”</p>' +
            '<div class="who"><b>' + esc(r.name || "Verified client") + '</b>' +
            (r.role ? ' · ' + esc(r.role) : '') + '</div></div>';
        });
        html += '</div>';
        html += '<div class="pf-note">Statements reflect individual customer experience. All QELVION products are supplied for laboratory research &amp; development use only — not for human or veterinary use.</div>';
      }

      html += '</div>';
      host.innerHTML = html;
      host.classList.add("on");
      host.classList.add("pad");

      host.querySelectorAll(".pf-tile").forEach(function (t) {
        t.addEventListener("click", function () { lightbox(t.getAttribute("data-src")); });
      });
    })
    .catch(function () {});
})();
