/* INSAN Bridge client — SpaceXAI / cameras / pairing. Key stays on the PC. */
(function (w) {
  var KEY = "insan-bridge-url";
  var DEFAULTS = ["http://127.0.0.1:8787", "http://localhost:8787"];

  function saved() {
    try { return (localStorage.getItem(KEY) || "").replace(/\/$/, ""); } catch (e) { return ""; }
  }
  function url() { return saved() || DEFAULTS[0]; }
  function setUrl(u) {
    u = String(u || "").trim().replace(/\/$/, "");
    try { if (u) localStorage.setItem(KEY, u); } catch (e) { /* ignore */ }
  }
  async function ping(base, ms) {
    try {
      var ctrl = new AbortController();
      var t = setTimeout(function () { ctrl.abort(); }, ms || 2500);
      var r = await fetch((base || url()) + "/health", { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  }
  async function find() {
    var list = [];
    var s = saved();
    if (s) list.push(s);
    DEFAULTS.forEach(function (d) { if (list.indexOf(d) < 0) list.push(d); });
    for (var i = 0; i < list.length; i++) {
      var h = await ping(list[i]);
      if (h && h.ok) {
        setUrl(list[i]);
        return { base: list[i], health: h };
      }
    }
    return null;
  }
  async function chat(app, text, system, history) {
    var messages = (history || []).concat([{ role: "user", content: text }]);
    var r = await fetch(url() + "/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: app, messages: messages, system: system || "" })
    });
    var j = {};
    try { j = await r.json(); } catch (e) { j = {}; }
    if (!r.ok || !j.ok) throw new Error(j.error || ("bridge HTTP " + r.status));
    return j.text;
  }
  async function post(path, body) {
    var r = await fetch(url() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    var j = {};
    try { j = await r.json(); } catch (e) { j = {}; }
    if (!r.ok || j.ok === false) throw new Error(j.error || ("bridge HTTP " + r.status));
    return j;
  }
  async function get(path) {
    var r = await fetch(url() + path);
    var j = {};
    try { j = await r.json(); } catch (e) { j = {}; }
    if (!r.ok || j.ok === false) throw new Error(j.error || ("bridge HTTP " + r.status));
    return j;
  }
  w.INSAN_BRIDGE = { url: url, setUrl: setUrl, ping: ping, find: find, chat: chat, post: post, get: get };
})(window);
