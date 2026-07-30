/* Polar Bear Editing — dependency-free UI */
(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Editing cost calculator
  var form = document.getElementById("cost-form");
  if (!form) return;

  var wordsEl = document.getElementById("word-count");
  var serviceEl = document.getElementById("service-type");
  var resultEl = document.getElementById("cost-result");
  var rangeEl = document.getElementById("cost-range");
  var detailEl = document.getElementById("cost-detail");
  var hoursEl = document.getElementById("cost-hours");

  // Mid-market indie ranges (USD per word) — educational estimates, not a quote
  var RATES = {
    critique: { low: 0.008, high: 0.018, label: "manuscript critique", wph: 2500 },
    developmental: { low: 0.03, high: 0.06, label: "developmental editing", wph: 900 },
    copyedit: { low: 0.018, high: 0.035, label: "copyediting", wph: 1400 },
    proofread: { low: 0.01, high: 0.02, label: "proofreading", wph: 2000 },
    package: { low: 0.045, high: 0.08, label: "dev + copy package", wph: 700 },
  };

  function money(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function calc() {
    var words = Math.max(0, parseInt(wordsEl.value, 10) || 0);
    var key = serviceEl.value;
    var r = RATES[key] || RATES.copyedit;
    if (words < 1000) {
      resultEl.hidden = false;
      rangeEl.textContent = "Enter at least 1,000 words";
      detailEl.textContent = "Typical novel length is 70,000–100,000 words.";
      hoursEl.textContent = "";
      return;
    }
    var low = Math.round(words * r.low);
    var high = Math.round(words * r.high);
    var hoursLow = Math.max(1, Math.round(words / (r.wph * 1.2)));
    var hoursHigh = Math.max(hoursLow + 1, Math.round(words / (r.wph * 0.75)));
    resultEl.hidden = false;
    rangeEl.textContent = money(low) + " – " + money(high);
    detailEl.textContent =
      "Educational market range for " +
      r.label +
      " on a " +
      words.toLocaleString() +
      "-word manuscript. Not a Polar Bear quote — every project is scoped after sample pages.";
    hoursEl.textContent =
      "Rough calendar effort: ~" + hoursLow + "–" + hoursHigh + " editor hours across passes.";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calc();
  });
  wordsEl.addEventListener("input", calc);
  serviceEl.addEventListener("change", calc);
  if (wordsEl.value) calc();
})();
