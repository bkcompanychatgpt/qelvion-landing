/* ============================================================
   QELVION Biotech · link slots runtime
   Reads assets/site-links.json (editable from /admin.html) and
   applies the configured destination to every marked element:
        <a data-qv="hero_cta_primary" href="#contact">
   Special slots:
     · product_quote_target  -> used by the catalog product buttons
     · float_whatsapp        -> default target of the floating button
                                (skipped once a sales rep is assigned)
   ============================================================ */
(function () {
  "use strict";
  var URL_JSON = "assets/site-links.json";

  function apply(map) {
    window.QVLinks = map || {};
    var nodes = document.querySelectorAll("[data-qv]");
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-qv");
      if (!key || !map || map[key] == null) return;
      if (key === "float_whatsapp" && el.dataset && el.dataset.qvSet) return; /* rep assigned */
      if (key === "product_quote_target") return;                            /* handled by catalog code */
      el.setAttribute("href", map[key]);
    });
  }

  fetch(URL_JSON + "?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (map) { apply(map); try{ document.dispatchEvent(new Event("qvlinks")); }catch(e){} })
    .catch(function () { window.QVLinks = {}; });
})();
