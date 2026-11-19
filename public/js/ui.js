// Tiny shared UI helpers: toasts, query params, number formatting.
const UI = {
  toast(msg, kind = "") {
    let host = document.getElementById("toast");
    if (!host) { host = document.createElement("div"); host.id = "toast"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 250); }, 2600);
  },
  err(msg) { this.toast(msg, "err"); },
  ok(msg)  { this.toast(msg, "ok"); },

  param(name) { return new URLSearchParams(location.search).get(name); },

  // 1234567 -> "1.23M", 12345 -> "12.3K"
  num(n) {
    n = Number(n) || 0;
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return Math.round(n).toString();
  },
  int(n) { return (Math.round(Number(n) || 0)).toLocaleString(); },
};
