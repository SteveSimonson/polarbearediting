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
  var sliderEl = document.getElementById("word-slider");
  var rangeEl = document.getElementById("cost-range");
  var detailEl = document.getElementById("cost-detail");
  var hoursEl = document.getElementById("cost-hours");
  var rateEl = document.getElementById("cost-rate");
  var weeksEl = document.getElementById("cost-weeks");
  var noteEl = document.getElementById("cost-note");
  var compareEl = document.getElementById("cost-compare");
  var quoteEl = document.getElementById("quote-link");
  var shareEl = document.getElementById("share-estimate");
  var presets = form.querySelectorAll(".preset[data-words]");

  var RATES = {
    critique: { low: 0.008, high: 0.018, label: "manuscript critique", href: "/services/manuscript-critique/", wph: 2500 },
    developmental: { low: 0.03, high: 0.06, label: "developmental editing", href: "/services/developmental-editing/", wph: 900 },
    copyedit: { low: 0.018, high: 0.035, label: "copyediting", href: "/services/copyediting/", wph: 1400 },
    proofread: { low: 0.01, high: 0.02, label: "proofreading", href: "/services/proofreading/", wph: 2000 },
    package: { low: 0.045, high: 0.08, label: "dev + copy package", href: "/services/", wph: 700 },
  };
  var RATE_ORDER = ["critique", "developmental", "copyedit", "proofread", "package"];
  var CONDITION = { clean: 0.9, typical: 1, rough: 1.2 };
  var RUSH = { standard: 1, rush: 1.2 };
  var STAGE_REC = {
    "first-draft": "critique",
    "post-beta": "developmental",
    "story-locked": "copyedit",
    "layout-ready": "proofread",
  };
  var STAGE_LABEL = {
    "first-draft": "a first full draft",
    "post-beta": "a revised / post-beta manuscript",
    "story-locked": "a story-locked manuscript",
    "layout-ready": "a final freeze",
  };
  var NOTE = {
    "first-draft:critique": "A critique is the usual first professional look: diagnosis before a full rewrite partnership.",
    "first-draft:developmental": "A full developmental pass on a first draft is a real partnership—budget for it, or start with a critique.",
    "first-draft:copyedit": "Copyediting a first draft means you may pay twice. Structure is still moving.",
    "first-draft:proofread": "Proofreading last. A first draft needs diagnosis or developmental work—proof will polish problems you still have to cut.",
    "first-draft:package": "A dev + copy package can fit a first draft if you already know you want both passes in sequence.",
    "post-beta:critique": "A critique can still diagnose. If you already know the problems, developmental is the working pass.",
    "post-beta:developmental": "Developmental is the usual pass after serious revision—especially when betas still flag story, structure, or pace.",
    "post-beta:copyedit": "If betas still report confusion or pace issues, copyediting will polish problems you still need to fix.",
    "post-beta:proofread": "Proofreading last. Post-beta manuscripts usually need developmental or at least copy, not a final polish.",
    "post-beta:package": "A two-pass package is a fair budget for a post-beta novel that still needs structure work, then language.",
    "story-locked:critique": "A critique is a diagnostic. If the story is locked, copyediting is usually the pass that earns its keep.",
    "story-locked:developmental": "If story and structure are locked, a full developmental pass is usually more than you need.",
    "story-locked:copyedit": "If the story is locked, copyediting is the pass that earns its keep. Proof comes after this.",
    "story-locked:proofread": "You can proof a locked manuscript, but copyediting first catches the consistency issues proof is not hired to rewrite.",
    "story-locked:package": "A two-pass package is heavy once the story is locked. Copy, then proof, is the usual path.",
    "layout-ready:critique": "A critique is not a last-pass polish. At final freeze you want proofreading.",
    "layout-ready:developmental": "Developmental belongs earlier. Frozen pages want proofreading—or a halt if you just found a story problem.",
    "layout-ready:copyedit": "Copyediting after layout means expensive reflow. Proofreading is the usual last pass.",
    "layout-ready:proofread": "Proofreading last. This is the right label once pages are frozen.",
    "layout-ready:package": "A two-pass package is the wrong tool for a frozen book. Ask for proofreading.",
  };

  function radioValue(name, fallback) {
    var picked = form.querySelector('input[name="' + name + '"]:checked');
    return picked ? picked.value : fallback;
  }

  function setRadio(name, value) {
    var el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  function money(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function perWord(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }

  function modifier() {
    var cond = CONDITION[radioValue("condition", "typical")] || 1;
    var rush = RUSH[radioValue("rush", "standard")] || 1;
    return cond * rush;
  }

  function estimate(key, words, mult) {
    var r = RATES[key] || RATES.copyedit;
    var low = Math.round(words * r.low * mult);
    var high = Math.round(words * r.high * mult);
    var hoursLow = Math.max(1, Math.round(words / (r.wph * 1.2)));
    var hoursHigh = Math.max(hoursLow + 1, Math.round(words / (r.wph * 0.75)));
    if (radioValue("rush", "standard") === "rush") {
      hoursLow = Math.max(1, Math.round(hoursLow * 0.7));
      hoursHigh = Math.max(hoursLow + 1, Math.round(hoursHigh * 0.75));
    }
    var weeksLow = Math.max(1, Math.round(hoursLow / 12));
    var weeksHigh = Math.max(weeksLow, Math.round(hoursHigh / 10));
    return {
      key: key,
      rate: r,
      low: low,
      high: high,
      hoursLow: hoursLow,
      hoursHigh: hoursHigh,
      weeksLow: weeksLow,
      weeksHigh: weeksHigh,
      rateLow: r.low * mult,
      rateHigh: r.high * mult,
    };
  }

  function clampWords(n) {
    if (!n || n < 1000) return 0;
    return Math.min(400000, n);
  }

  function syncSlider(words) {
    if (!sliderEl) return;
    var min = parseInt(sliderEl.min, 10);
    var max = parseInt(sliderEl.max, 10);
    sliderEl.value = String(Math.max(min, Math.min(max, words || min)));
  }

  function markPresets(words) {
    presets.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(parseInt(btn.getAttribute("data-words"), 10) === words));
    });
  }

  function stateFromQuery() {
    var q = new URLSearchParams(window.location.search);
    var words = parseInt(q.get("words"), 10);
    if (words) {
      wordsEl.value = String(clampWords(words) || words);
      syncSlider(parseInt(wordsEl.value, 10));
    }
    if (q.get("service") && RATES[q.get("service")]) setRadio("service", q.get("service"));
    if (q.get("stage") && STAGE_REC[q.get("stage")]) setRadio("stage", q.get("stage"));
    if (q.get("condition") && CONDITION[q.get("condition")]) setRadio("condition", q.get("condition"));
    if (q.get("rush") && RUSH[q.get("rush")]) setRadio("rush", q.get("rush"));
  }

  function writeQuery(words, service, stage, condition, rush) {
    if (!window.history || !window.history.replaceState) return;
    var next = new URLSearchParams({
      words: String(words),
      service: service,
      stage: stage,
      condition: condition,
      rush: rush,
    });
    var url = window.location.pathname + "?" + next.toString();
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, "", url);
    }
  }

  function recommend(stage, service) {
    var rec = STAGE_REC[stage] || "developmental";
    var ok =
      service === rec ||
      (service === "package" && (stage === "first-draft" || stage === "post-beta")) ||
      (service === "developmental" && stage === "first-draft") ||
      (service === "critique" && stage === "post-beta");
    var text = NOTE[stage + ":" + service] || NOTE[stage + ":" + rec];
    return { ok: ok, rec: rec, text: text };
  }

  function renderCompare(words, mult, current) {
    if (!compareEl) return;
    compareEl.textContent = "";
    RATE_ORDER.forEach(function (key) {
      var est = estimate(key, words, mult);
      var tr = document.createElement("tr");
      if (key === current) tr.className = "is-current";
      var name = document.createElement("td");
      var link = document.createElement("a");
      link.href = est.rate.href;
      link.textContent = est.rate.label.charAt(0).toUpperCase() + est.rate.label.slice(1);
      name.appendChild(link);
      var range = document.createElement("td");
      range.textContent = money(est.low) + " – " + money(est.high);
      var hours = document.createElement("td");
      hours.textContent = est.hoursLow + "–" + est.hoursHigh;
      tr.appendChild(name);
      tr.appendChild(range);
      tr.appendChild(hours);
      compareEl.appendChild(tr);
    });
  }

  function calc() {
    var words = clampWords(parseInt(wordsEl.value, 10) || 0);
    var service = radioValue("service", "developmental");
    var stage = radioValue("stage", "post-beta");
    var condition = radioValue("condition", "typical");
    var rush = radioValue("rush", "standard");
    var r = RATES[service] || RATES.developmental;
    markPresets(parseInt(wordsEl.value, 10) || 0);

    if (!words) {
      rangeEl.textContent = "Enter at least 1,000 words";
      detailEl.textContent = "Typical novel length is 70,000–100,000 words.";
      if (rateEl) rateEl.textContent = "—";
      hoursEl.textContent = "—";
      if (weeksEl) weeksEl.textContent = "—";
      if (noteEl) noteEl.hidden = true;
      if (compareEl) compareEl.textContent = "";
      return;
    }

    var est = estimate(service, words, modifier());
    var rec = recommend(stage, service);
    rangeEl.textContent = money(est.low) + " – " + money(est.high);
    detailEl.textContent =
      "Educational market range for " +
      r.label +
      " on a " +
      words.toLocaleString() +
      "-word manuscript" +
      (condition !== "typical" ? ", " + condition + " condition" : "") +
      (rush === "rush" ? ", rush timeline" : "") +
      ". Not a Polar Bear quote — every project is scoped after sample pages.";
    if (rateEl) rateEl.textContent = perWord(est.rateLow) + "–" + perWord(est.rateHigh);
    hoursEl.textContent = est.hoursLow + "–" + est.hoursHigh + " hrs";
    if (weeksEl) {
      weeksEl.textContent =
        est.weeksLow === est.weeksHigh
          ? "~" + est.weeksHigh + " wk"
          : "~" + est.weeksLow + "–" + est.weeksHigh + " wk";
    }
    if (noteEl) {
      noteEl.hidden = false;
      noteEl.textContent = "";
      var strong = document.createElement("strong");
      strong.textContent = rec.ok ? "Stage fit. " : "Stage mismatch. ";
      noteEl.appendChild(strong);
      noteEl.appendChild(document.createTextNode(rec.text + " "));
      if (!rec.ok) {
        var apply = document.createElement("button");
        apply.type = "button";
        apply.className = "calc-apply";
        apply.textContent = "Switch to " + RATES[rec.rec].label + " →";
        apply.addEventListener("click", function () {
          setRadio("service", rec.rec);
          calc();
        });
        noteEl.appendChild(apply);
      }
    }
    if (quoteEl) {
      var subject = "Editing inquiry — " + words.toLocaleString() + "-word " + r.label;
      var body = [
        "Hi Polar Bear,",
        "",
        "I used the cost calculator.",
        "",
        "Word count: " + words.toLocaleString(),
        "Service: " + r.label,
        "Stage: " + (STAGE_LABEL[stage] || stage),
        "Condition: " + condition,
        "Timeline: " + rush,
        "Educational range: " + money(est.low) + " – " + money(est.high),
        "",
        "Genre:",
        "Deadline:",
        "What I need help with:",
        "",
      ].join("\n");
      quoteEl.href =
        "mailto:hello@polarbearediting.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    }
    renderCompare(words, modifier(), service);
    writeQuery(words, service, stage, condition, rush);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calc();
  });
  form.addEventListener("change", calc);
  wordsEl.addEventListener("input", function () {
    syncSlider(parseInt(wordsEl.value, 10) || 0);
    calc();
  });
  if (sliderEl) {
    sliderEl.addEventListener("input", function () {
      wordsEl.value = sliderEl.value;
      calc();
    });
  }
  presets.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var n = parseInt(btn.getAttribute("data-words"), 10);
      wordsEl.value = String(n);
      syncSlider(n);
      calc();
    });
  });
  if (shareEl) {
    shareEl.addEventListener("click", function () {
      calc();
      var url = window.location.href;
      var done = function () {
        var old = shareEl.textContent;
        shareEl.textContent = "Copied";
        window.setTimeout(function () {
          shareEl.textContent = old;
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () {
          window.prompt("Copy this estimate URL", url);
        });
      } else {
        window.prompt("Copy this estimate URL", url);
      }
    });
  }
  stateFromQuery();
  if (wordsEl.value) calc();
})();
