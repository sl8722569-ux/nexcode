(function () {
  const $ = (id) => document.getElementById(id);
  const DEFAULT_FILES = {
    "README.md": "# NEXCODE\nCross-device editor from INSAN CREATIONS.\n\nFiles in this Early Access live in your browser only.\nGemini's draft leaked a prompt into the UI and cut the file off before JavaScript existed. This build actually runs.\n",
    "app.js": "function greet(name) {\n  return 'Hello, ' + name;\n}\n\n// Line 8 — session demo target\nconsole.log(greet('NEXCODE'));\n",
    "styles.css": "body {\n  margin: 0;\n  font-family: system-ui;\n  background: #1e1e1e;\n  color: #ccc;\n}\n",
    "nexcode.json": "{\n  \"name\": \"demo-workspace\",\n  \"pairing\": \"local-browser\",\n  \"ai\": \"on-device until SpaceXAI backend\"\n}\n"
  };

  function loadFiles() {
    try {
      const raw = localStorage.getItem("nexcode-fs");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* defaults */ }
    return Object.assign({}, DEFAULT_FILES);
  }
  function saveFiles() { localStorage.setItem("nexcode-fs", JSON.stringify(files)); }
  function loadSessions() {
    try { return JSON.parse(localStorage.getItem("nexcode-sessions") || "[]"); } catch (e) { return []; }
  }
  function saveSessions() { localStorage.setItem("nexcode-sessions", JSON.stringify(sessions.slice(0, 40))); }

  let files = loadFiles();
  let sessions = loadSessions();
  let current = "app.js";
  let canvas = "home";
  let tab = "explorer";
  let pairCode = localStorage.getItem("nexcode-pair") || String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem("nexcode-pair", pairCode);

  const COMMANDS = [
    { id: "palette", label: "Command Palette" },
    { id: "open", label: "Open File" },
    { id: "explorer", label: "Show Explorer" },
    { id: "search", label: "Search workspace" },
    { id: "git", label: "Source / sync (demo)" },
    { id: "debug", label: "Run & debug (demo)" },
    { id: "ai", label: "AI lab" },
    { id: "sessions", label: "Sessions timeline" },
    { id: "mobile", label: "Toggle mobile view" },
    { id: "host", label: "Host view" },
    { id: "pair", label: "Pairing code" },
    { id: "conflict", label: "Simulate save conflict" },
    { id: "terminal", label: "Toggle terminal" },
    { id: "home", label: "Welcome" }
  ];

  function logSession(note) {
    sessions.unshift({ t: new Date().toISOString(), file: current, note: note });
    saveSessions();
    if (tab === "sessions") renderDrawer();
  }

  function setTab(id) {
    tab = id;
    document.querySelectorAll(".activity [data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === id));
    const titles = { explorer: "EXPLORER", search: "SEARCH", git: "SOURCE CONTROL", debug: "RUN AND DEBUG", ai: "AI LAB", sessions: "SESSIONS" };
    $("drawer-title").textContent = titles[id] || id.toUpperCase();
    renderDrawer();
  }

  function renderDrawer() {
    const box = $("drawer");
    if (tab === "explorer") {
      box.innerHTML = Object.keys(files).map((n) =>
        '<button class="file' + (n === current ? " on" : "") + '" data-open="' + n + '">' + n + "</button>"
      ).join("");
      box.querySelectorAll("[data-open]").forEach((b) => { b.onclick = () => openFile(b.dataset.open); });
      return;
    }
    if (tab === "search") {
      box.innerHTML = '<input id="ws-q" placeholder="Search in files" style="width:100%;background:#1e1e1e;border:1px solid #3c3c3c;padding:6px;border-radius:4px" /><div id="ws-hits" class="note"></div>';
      $("ws-q").oninput = () => {
        const q = $("ws-q").value.toLowerCase();
        if (!q) { $("ws-hits").textContent = ""; return; }
        const hits = [];
        Object.keys(files).forEach((n) => {
          files[n].split("\n").forEach((line, i) => {
            if (line.toLowerCase().indexOf(q) >= 0) hits.push(n + ":" + (i + 1) + "  " + line.trim());
          });
        });
        $("ws-hits").textContent = hits.slice(0, 20).join("\n") || "No matches.";
      };
      return;
    }
    if (tab === "git") {
      box.innerHTML = '<p class="note">No real Git remote in Early Access. Local saves are listed as demo snapshots.</p>' +
        sessions.slice(0, 8).map((s) => "<div class=\"file\">" + s.note + "<br><span class=\"muted\">" + new Date(s.t).toLocaleString() + "</span></div>").join("");
      return;
    }
    if (tab === "debug") {
      box.innerHTML = '<p class="note">Run/Debug is a UI stub. This page cannot execute your project on a device.</p><button class="file" id="dbg-run">▶ Run demo log</button>';
      $("dbg-run").onclick = () => termPrint("Run: greet('NEXCODE') → Hello, NEXCODE\n(Demo only. No runtime.)");
      return;
    }
    if (tab === "ai") {
      box.innerHTML = '<p class="note">On-device helper. SpaceXAI belongs on a backend. No API keys in this page.</p><div id="ai-log" class="note"></div><input id="ai-q" placeholder="Ask about NEXCODE…" style="width:100%;background:#1e1e1e;border:1px solid #3c3c3c;padding:6px" />';
      $("ai-q").onkeydown = (e) => {
        if (e.key !== "Enter") return;
        const v = $("ai-q").value.trim();
        if (!v) return;
        $("ai-q").value = "";
        $("ai-log").textContent += "You: " + v + "\nNEX: " + aiReply(v) + "\n\n";
      };
      return;
    }
    box.innerHTML = '<p class="note">Handoff history on this device. Not a live phone until a sync server exists.</p>' +
      (sessions.length ? sessions.slice(0, 12).map((s) => "<div class=\"file\">" + s.note + "<br><span class=\"muted\">" + s.file + " · " + new Date(s.t).toLocaleString() + "</span></div>").join("") : "<p class=\"note\">No sessions yet. Edit a file to create one.</p>");
  }

  function aiReply(v) {
    const low = v.toLowerCase();
    if (/pair|phone|mobile/.test(low)) return "Use Host / Mobile in the top bar. Same files, smaller UI. Real device pairing needs a backend.";
    if (/git|github/.test(low)) return "Source panel lists local snapshots. Push/pull is not wired. Do not paste tokens here.";
    if (/gemini|wrong|leak/.test(low)) return "The Gemini draft put your prompt into the Open File shortcut and never shipped JavaScript. This build removes that and actually opens files.";
    if (/key|api|spacex/.test(low)) return "No AI keys in the browser. SpaceXAI can be added server-side later.";
    return "NEXCODE Early Access: edit files here, they persist in localStorage. Command palette: Ctrl+Shift+P.";
  }

  function openFile(name) {
    if (!files[name]) return;
    current = name;
    $("code").value = files[name];
    $("tab-file").textContent = name;
    $("mob-file").value = name;
    $("mob-code").value = files[name];
    setCanvas("editor");
    paintGutter();
    renderDrawer();
    status();
  }

  function setCanvas(which) {
    canvas = which;
    $("home").classList.toggle("hidden", which !== "home");
    $("editor").classList.toggle("hidden", which !== "editor");
    $("tab-home").classList.toggle("on", which === "home");
    $("tab-file").classList.toggle("on", which === "editor");
  }

  function paintGutter() {
    const n = ($("code").value || "").split("\n").length;
    $("gutter").textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
  }
  function status() {
    const ta = $("code");
    const pos = ta.selectionStart || 0;
    const until = ta.value.slice(0, pos);
    const ln = until.split("\n").length;
    const col = until.split("\n").pop().length + 1;
    $("status-r").textContent = current + " · Ln " + ln + ", Col " + col;
    $("status-l").textContent = "NEXCODE · local · pair " + pairCode;
  }

  function persist() {
    files[current] = $("code").value;
    saveFiles();
    $("mob-code").value = files[current];
    logSession("Saved " + current + " on Host");
    status();
  }

  function setView(mode) {
    document.body.classList.toggle("mobile-on", mode === "mobile");
    $("btn-host").classList.toggle("on", mode === "desktop");
    $("btn-mobile").classList.toggle("on", mode === "mobile");
    $("host-badge").textContent = mode === "mobile" ? "Mobile" : "Host";
    fillMobFiles();
  }
  function fillMobFiles() {
    $("mob-file").innerHTML = Object.keys(files).map((n) => "<option>" + n + "</option>").join("");
    $("mob-file").value = current;
    $("mob-code").value = files[current] || "";
  }

  function showPalette(on) {
    $("palette-wrap").classList.toggle("hidden", !on);
    if (on) { $("palette-q").value = ""; renderPalette(""); $("palette-q").focus(); }
  }
  function renderPalette(q) {
    const low = (q || "").toLowerCase();
    $("palette-list").innerHTML = COMMANDS.filter((c) => c.label.toLowerCase().indexOf(low) >= 0)
      .map((c) => "<button type=\"button\" data-run=\"" + c.id + "\">" + c.label + "</button>").join("");
    $("palette-list").querySelectorAll("[data-run]").forEach((b) => {
      b.onclick = () => { showPalette(false); run(b.dataset.run); };
    });
  }

  function run(cmd) {
    if (cmd === "palette") return showPalette(true);
    if (cmd === "open" || cmd === "explorer") { setTab("explorer"); setCanvas("editor"); return; }
    if (cmd === "search") return setTab("search");
    if (cmd === "git") return setTab("git");
    if (cmd === "debug") return setTab("debug");
    if (cmd === "ai") { setTab("ai"); return; }
    if (cmd === "sessions") return setTab("sessions");
    if (cmd === "mobile") return setView("mobile");
    if (cmd === "host") return setView("desktop");
    if (cmd === "home") return setCanvas("home");
    if (cmd === "terminal") {
      $("term").style.display = $("term").style.display === "none" ? "flex" : "none";
      return;
    }
    if (cmd === "pair") {
      $("pair-code").textContent = pairCode;
      $("pair-wrap").classList.remove("hidden");
      return;
    }
    if (cmd === "conflict") {
      const other = files[current] + "\n// incoming from Mobile view (demo conflict)\n";
      $("banner").classList.remove("hidden");
      $("banner-text").textContent = "Demo conflict on " + current + " — two versions in this browser, not a real phone.";
      $("banner-jump").onclick = () => {
        files[current] = other;
        $("code").value = other;
        paintGutter();
        setCanvas("editor");
      };
      termPrint("Conflict simulated on " + current + " (demo).");
      logSession("Simulated conflict on " + current);
    }
  }

  function termPrint(t) {
    $("term-out").textContent += t + "\n";
    $("term-out").scrollTop = $("term-out").scrollHeight;
  }
  termPrint("NEXCODE demo shell. Commands: help, ls, cat, clear, pair");

  $("term-f").onsubmit = (e) => {
    e.preventDefault();
    const v = $("term-in").value.trim();
    $("term-in").value = "";
    if (!v) return;
    termPrint("nexcode:~$ " + v);
    const [cmd, arg] = v.split(/\s+/, 2);
    if (cmd === "help") termPrint("help ls cat <file> clear pair");
    else if (cmd === "ls") termPrint(Object.keys(files).join("  "));
    else if (cmd === "cat") termPrint(files[arg] || "not found");
    else if (cmd === "clear") $("term-out").textContent = "";
    else if (cmd === "pair") termPrint("pair code " + pairCode);
    else termPrint("unknown: " + cmd);
  };

  document.querySelectorAll("[data-cmd]").forEach((el) => {
    el.addEventListener("click", () => run(el.getAttribute("data-cmd")));
  });
  document.querySelectorAll(".activity [data-tab]").forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });
  $("btn-palette").onclick = () => showPalette(true);
  $("searchchip").onclick = () => showPalette(true);
  $("btn-host").onclick = () => setView("desktop");
  $("btn-mobile").onclick = () => setView("mobile");
  $("mob-host").onclick = () => setView("desktop");
  $("tab-home").onclick = () => setCanvas("home");
  $("tab-file").onclick = () => setCanvas("editor");
  $("banner-x").onclick = () => $("banner").classList.add("hidden");
  $("term-toggle").onclick = () => run("terminal");
  $("code").addEventListener("input", () => { paintGutter(); persist(); });
  $("code").addEventListener("keyup", status);
  $("code").addEventListener("click", status);
  $("mob-file").onchange = () => openFile($("mob-file").value);
  $("mob-code").addEventListener("input", () => {
    files[current] = $("mob-code").value;
    $("code").value = files[current];
    saveFiles();
    paintGutter();
    logSession("Saved " + current + " on Mobile view");
  });
  $("palette-q").oninput = () => renderPalette($("palette-q").value);
  $("palette-wrap").onclick = (e) => { if (e.target === $("palette-wrap")) showPalette(false); };
  $("pair-close").onclick = () => $("pair-wrap").classList.add("hidden");
  $("pair-copy").onclick = () => { navigator.clipboard.writeText(pairCode).catch(() => {}); };
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { showPalette(false); $("pair-wrap").classList.add("hidden"); }
    if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) { e.preventDefault(); showPalette(true); }
    if (e.ctrlKey && !e.shiftKey && (e.key === "o" || e.key === "O")) { e.preventDefault(); run("open"); }
    if (e.ctrlKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); run("sessions"); }
    if (e.ctrlKey && e.altKey && (e.key === "i" || e.key === "I")) { e.preventDefault(); run("ai"); }
    if (e.ctrlKey && e.shiftKey && (e.key === "e" || e.key === "E")) { e.preventDefault(); run("explorer"); }
  });

  fillMobFiles();
  setTab("explorer");
  status();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
