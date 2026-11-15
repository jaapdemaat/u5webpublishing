/* =========================================================
   Live HTML/CSS playgrounds, contents highlight and checklist.
   No libraries: works offline, straight from the folder.

   Markup for a playground:
   <div class="playground" id="pg-skeleton" data-title="Title">
     <textarea class="pg-src" data-lang="html">…</textarea>
     <textarea class="pg-src" data-lang="css">…</textarea>
     <div class="pg-task">…optional task…</div>
   </div>
   ========================================================= */
(function () {
  "use strict";

  var STORE = "u5-htmlcss:";
  function load(key) { try { return localStorage.getItem(STORE + key); } catch (e) { return null; } }
  function save(key, val) { try { localStorage.setItem(STORE + key, val); } catch (e) {} }
  function drop(key) { try { localStorage.removeItem(STORE + key); } catch (e) {} }

  // Runs inside every preview. Pages shown in a preview (srcdoc) share
  // this site's address, so a plain href="#id" would load the whole
  // site inside the box. This makes in-page links (and :target) behave
  // exactly as they will in your own index.html, and opens outside
  // links in a new tab.
  var PREVIEW_HELPER =
    "<script>document.addEventListener('click',function(e){" +
    "var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');" +
    "if(h.charAt(0)==='#'){e.preventDefault();if(h.length>1){location.hash=h.slice(1);}else{history.replaceState(null,'',' ');scrollTo(0,0);}}" +
    "else{e.preventDefault();window.open(a.href,'_blank','noopener');}" +
    "});<\/script>";

  function buildDoc(html, css, forPreview) {
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n" +
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "  <title>My page</title>\n" +
      (forPreview ? "  <style>\n" + css + "\n  </style>\n" : "  <link rel=\"stylesheet\" href=\"style.css\">\n") +
      "</head>\n<body>\n" + html + "\n" + (forPreview ? PREVIEW_HELPER : "") + "</body>\n</html>\n";
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function dedent(s) {
    s = s.replace(/^\n+/, "").replace(/\s+$/, "");
    var lines = s.split("\n");
    var min = Infinity;
    lines.forEach(function (l) { if (l.trim()) { min = Math.min(min, l.match(/^ */)[0].length); } });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); }).join("\n") + "\n";
  }


  /* ---------- Syntax colours (VS Code "Dark+" style) ---------- */
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function span(cls, t) { return '<span class="tk-' + cls + '">' + esc(t) + "</span>"; }

  function highlightHTML(src) {
    var out = "", re = /<!--[\s\S]*?(-->|$)|<[^>]*>?/g, last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      var tok = m[0];
      if (tok.indexOf("<!--") === 0) { out += span("comment", tok); }
      else {
        var t = tok.match(/^(<\/?)([\w-]*)([\s\S]*?)(\/?>)?$/);
        if (!t) { out += esc(tok); }
        else {
          out += span("punct", t[1]) + span("tag", t[2]);
          out += t[3].replace(/("[^"]*"?|'[^']*'?)|([^\s=]+)|([\s\S])/g, function (all, str, name, other) {
            if (str) return span("string", str);
            if (name) return span("attr", name);
            return esc(other);
          });
          if (t[4]) out += span("punct", t[4]);
        }
      }
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  function highlightCSS(src) {
    var out = "", i = 0, n = src.length;
    while (i < n) {
      if (src.substr(i, 2) === "/*") {
        var e = src.indexOf("*/", i + 2); e = e < 0 ? n : e + 2;
        out += span("comment", src.slice(i, e)); i = e; continue;
      }
      // read up to the next { ; } (or comment)
      var j = i, stop = "";
      while (j < n) {
        var ch = src[j];
        if (ch === "{" || ch === ";" || ch === "}") { stop = ch; break; }
        if (src.substr(j, 2) === "/*") break;
        j++;
      }
      var seg = src.slice(i, j);
      if (stop === "{") {
        out += seg.trim().charAt(0) === "@" ? seg.replace(/(@[\w-]+)/, function (a) { return "\u0000" + a + "\u0001"; }).split("\u0000").map(function (x) {
          return x.indexOf("\u0001") > -1 ? span("at", x.split("\u0001")[0]) + esc(x.split("\u0001")[1]) : esc(x);
        }).join("") : span("selector", seg);
      } else if (seg.indexOf(":") > -1 && /\S/.test(seg)) {
        var k = seg.indexOf(":");
        out += span("prop", seg.slice(0, k)) + span("punct", ":") + span("value", seg.slice(k + 1));
      } else { out += esc(seg); }
      if (stop) { out += span("punct", stop); j++; }
      i = j;
    }
    return out;
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    if (text) n.textContent = text;
    return n;
  }

  function setupPlayground(pg, index) {
    var id = pg.id || ("pg-" + index);
    var title = pg.getAttribute("data-title") || "Try it";
    var srcs = Array.prototype.slice.call(pg.querySelectorAll("textarea.pg-src"));
    var task = pg.querySelector(".pg-task");
    var originals = {};
    var codes = {};

    var head = el("div", { "class": "pg-head" });
    head.appendChild(el("span", { "class": "pg-title" }, title));
    var actions = el("div", { "class": "pg-actions" });
    var bPhone = el("button", { "class": "pg-btn", type: "button", "aria-pressed": "false", title: "Preview at phone width" }, "📱 Phone");
    var bReset = el("button", { "class": "pg-btn", type: "button", title: "Back to the starting code" }, "↺ Reset");
    var bCopy = el("button", { "class": "pg-btn", type: "button", title: "Copy the code in the open tab" }, "Copy");
    var bHtml = el("button", { "class": "pg-btn", type: "button", title: "Download as index.html for VS Code" }, "⬇ index.html");
    var bCss = el("button", { "class": "pg-btn", type: "button", title: "Download as style.css for VS Code" }, "⬇ style.css");
    [bPhone, bReset, bCopy, bHtml, bCss].forEach(function (b) { actions.appendChild(b); });
    head.appendChild(actions);

    var body = el("div", { "class": "pg-body" });
    var editors = el("div", { "class": "pg-editors" });
    var tabs = el("div", { "class": "pg-tabs", role: "tablist" });
    editors.appendChild(tabs);

    var previewWrap = el("div", { "class": "pg-preview-wrap" });
    var frame = el("iframe", { "class": "pg-preview", title: "Live preview: " + title, loading: "lazy" });
    previewWrap.appendChild(frame);

    srcs.forEach(function (src, i) {
      var lang = src.getAttribute("data-lang");
      var start = dedent(src.value);
      originals[lang] = start;
      var saved = load(id + ":" + lang);
      var ta = el("textarea", {
        "class": "pg-code", spellcheck: "false", autocapitalize: "off", autocomplete: "off", wrap: "off",
        "aria-label": lang.toUpperCase() + " code for " + title, "data-lang": lang
      });
      ta.value = saved !== null ? saved : start;
      codes[lang] = ta;

      // VS Code-style file: line numbers + coloured code behind a transparent textarea
      var file = el("div", { "class": "pg-file" });
      var gutter = el("div", { "class": "pg-gutter", "aria-hidden": "true" });
      var field = el("div", { "class": "pg-field" });
      var hlPre = el("pre", { "class": "pg-hl", "aria-hidden": "true" });
      field.appendChild(hlPre);
      field.appendChild(ta);
      file.appendChild(gutter);
      file.appendChild(field);
      ta._paint = function () {
        hlPre.innerHTML = (lang === "css" ? highlightCSS(ta.value) : highlightHTML(ta.value)) + "\n";
        var lines = ta.value.split("\n").length, nums = "";
        for (var L = 1; L <= lines; L++) nums += L + "\n";
        gutter.textContent = nums;
        hlPre.scrollTop = ta.scrollTop; hlPre.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop;
      };
      ta.addEventListener("scroll", function () {
        hlPre.scrollTop = ta.scrollTop; hlPre.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop;
      });
      ta._paint();

      var tab = el("button", { "class": "pg-tab", type: "button", role: "tab", "aria-selected": i === 0 ? "true" : "false" },
        lang === "html" ? "index.html" : "style.css");
      tab.setAttribute("data-lang", lang);
      tab.addEventListener("click", function () {
        tabs.querySelectorAll(".pg-tab").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        editors.querySelectorAll(".pg-file").forEach(function (c) { c.hidden = true; });
        file.hidden = false;
      });
      if (i !== 0) file.hidden = true;
      tabs.appendChild(tab);
      editors.appendChild(file);
      src.remove();
    });
    if (!codes.css) { bCss.remove(); }

    body.appendChild(editors);
    body.appendChild(previewWrap);
    pg.insertBefore(body, task || null);
    pg.insertBefore(head, body);

    var timer = null;
    function render() {
      var html = codes.html ? codes.html.value : "";
      var css = codes.css ? codes.css.value : "";
      frame.srcdoc = buildDoc(html, css, true);
    }
    function changed(ta) {
      if (ta._paint) ta._paint();
      save(id + ":" + ta.getAttribute("data-lang"), ta.value);
      clearTimeout(timer);
      timer = setTimeout(render, 250);
    }

    Object.keys(codes).forEach(function (lang) {
      var ta = codes[lang];
      var trapTab = true;
      ta.addEventListener("input", function () { changed(ta); });
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { trapTab = false; return; }
        if (e.key === "Tab" && trapTab && !e.shiftKey) {
          e.preventDefault();
          var s = ta.selectionStart, en = ta.selectionEnd;
          ta.setRangeText("  ", s, en, "end");
          changed(ta);
        }
      });
      ta.addEventListener("blur", function () { trapTab = true; });
    });

    bPhone.addEventListener("click", function () {
      var on = bPhone.getAttribute("aria-pressed") !== "true";
      bPhone.setAttribute("aria-pressed", on ? "true" : "false");
      frame.classList.toggle("is-phone", on);
    });
    bReset.addEventListener("click", function () {
      Object.keys(codes).forEach(function (lang) {
        codes[lang].value = originals[lang];
        if (codes[lang]._paint) codes[lang]._paint();
        drop(id + ":" + lang);
      });
      render();
    });
    bCopy.addEventListener("click", function () {
      var open = editors.querySelector(".pg-file:not([hidden]) .pg-code");
      var done = function () { bCopy.textContent = "Copied ✓"; setTimeout(function () { bCopy.textContent = "Copy"; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(open.value).then(done, function () { open.select(); });
      } else { open.select(); }
    });
    bHtml.addEventListener("click", function () {
      download("index.html", buildDoc(codes.html ? codes.html.value : "", "", false), "text/html");
    });
    bCss.addEventListener("click", function () {
      if (codes.css) download("style.css", codes.css.value, "text/css");
    });

    // Render only when the playground comes near the screen
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { render(); io.disconnect(); } });
      }, { rootMargin: "400px" });
      io.observe(pg);
    } else { render(); }
  }

  document.querySelectorAll(".playground").forEach(setupPlayground);

  /* ---------- Contents: highlight the lesson on screen ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var targets = Object.keys(map).map(function (k) { return document.getElementById(k); }).filter(Boolean);
  // The active lesson is the last one whose top has passed 35% of the window.
  var current = null, ticking = false;
  function highlight() {
    ticking = false;
    var line = window.innerHeight * 0.35, found = null;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].getBoundingClientRect().top <= line) found = targets[i]; else break;
    }
    var link = found ? map[found.id] : null;
    if (link !== current) {
      if (current) current.classList.remove("active");
      if (link) link.classList.add("active");
      current = link;
    }
  }
  if (targets.length) {
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(highlight); }
    }, { passive: true });
    window.addEventListener("resize", highlight);
    highlight();
  }

  /* ---------- Folded lessons: open the right one from any link ---------- */
  function openForHash() {
    var h = location.hash;
    if (!h || h.length < 2) return;
    var t;
    try { t = document.getElementById(decodeURIComponent(h.slice(1))); } catch (e) { t = null; }
    if (!t) return;
    var fold = t.querySelector(":scope > details.lesson-fold");
    var opened = false;
    if (fold && !fold.open) { fold.open = true; opened = true; }
    var el = t;
    while (el) { if (el.tagName === "DETAILS" && !el.open) { el.open = true; opened = true; } el = el.parentElement; }
    if (opened) requestAnimationFrame(function () { t.scrollIntoView({ block: "start" }); });
  }
  window.addEventListener("hashchange", openForHash);
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href^='#']");
    if (a) setTimeout(openForHash, 0);
  });
  openForHash();

  /* ---------- Done buttons + progress (remembered in this browser) ---------- */
  var lessons = Array.prototype.slice.call(document.querySelectorAll("section.lesson[id]"))
    .filter(function (s) { return s.querySelector(".done-btn"); });
  var essentials = lessons.filter(function (s) { return s.hasAttribute("data-essential"); });
  var essLabel = document.querySelector("[data-ess-label]");
  var essBar = document.querySelector("[data-ess-bar]");
  var allLabel = document.querySelector("[data-all-label]");
  var cheers = [
    "Nice one. ✓",
    "Done. Another tool in the box.",
    "Look at you go.",
    "Sorted. On to the next one whenever you're ready."
  ];
  var milestones = {
    1: "First essential done. Starting is the hardest part.",
    3: "Halfway through the essentials. 🙌",
    5: "One essential to go!",
    6: "All six essentials done. You can publish your critical report now. 🎉 Everything else is a bonus."
  };
  function isDone(id) { return load("done:" + id) === "1"; }
  function paint() {
    var essDone = essentials.filter(function (s) { return isDone(s.id); }).length;
    var allDone = lessons.filter(function (s) { return isDone(s.id); }).length;
    if (essLabel) essLabel.textContent = "Essentials: " + essDone + " of " + essentials.length + " done";
    if (essBar) essBar.style.width = (essentials.length ? (essDone / essentials.length * 100) : 0) + "%";
    if (allLabel) allLabel.textContent = allDone ? allDone + " of " + lessons.length + " lessons done in total" : "Tick lessons off as you go.";
    lessons.forEach(function (s) {
      var d = isDone(s.id);
      s.classList.toggle("is-done", d);
      var b = s.querySelector(".done-btn");
      if (b) b.textContent = d ? "✓ Done (click to undo)" : "✓ Mark as done";
      var link = document.querySelector(".toc a[href='#" + s.id + "']");
      if (link) link.classList.toggle("done", d);
    });
    return essDone;
  }
  lessons.forEach(function (s) {
    var b = s.querySelector(".done-btn");
    var msg = s.querySelector(".done-msg");
    b.addEventListener("click", function () {
      var was = isDone(s.id);
      if (was) { drop("done:" + s.id); msg.textContent = ""; paint(); return; }
      save("done:" + s.id, "1");
      var essDone = paint();
      var text = cheers[Math.floor(Math.random() * cheers.length)];
      if (s.hasAttribute("data-essential") && milestones[essDone]) text = milestones[essDone];
      msg.textContent = text;
    });
  });
  paint();

  /* ---------- Open Studio checklist (remembered in this browser) ---------- */
  var boxes = Array.prototype.slice.call(document.querySelectorAll(".checklist input[type=checkbox]"));
  var progress = document.querySelector("[data-progress]");
  function updateProgress() {
    if (!progress) return;
    var n = boxes.filter(function (b) { return b.checked; }).length;
    progress.textContent = n === boxes.length ? "All " + n + " done. You're ready for Open Studio 🎉" : n + " of " + boxes.length + " done";
  }
  boxes.forEach(function (b, i) {
    var key = "check:" + (b.id || i);
    if (load(key) === "1") b.checked = true;
    b.addEventListener("change", function () { b.checked ? save(key, "1") : drop(key); updateProgress(); });
  });
  updateProgress();
})();

/* Phones: start with the contents folded so the page opens on the welcome, not a long list */
(function () {
  var w = document.querySelector(".toc-wrap");
  if (!w || !window.matchMedia) return;
  if (window.matchMedia("(max-width: 959px)").matches) w.removeAttribute("open");
  w.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 959px)").matches) w.removeAttribute("open");
    });
  });
})();
