// Content script for chess.com.
// Detects finished games by polling the chess.com API (no dependency on page CSS),
// then shows a banner offering analysis on Lichess.

const startedAt = Math.floor(Date.now() / 1000);
let lastShown = 0;
let busy = false;

async function getUsername() {
  let { username } = await browser.storage.local.get("username");
  if (!username) {
    username = (prompt("Chess.com to Lichess Bridge\n\nEnter your chess.com username (it will be saved):") || "").trim();
    if (username) await browser.storage.local.set({ username });
  }
  return username;
}

function showBanner(pgn) {
  document.getElementById("clb-banner")?.remove();

  const box = document.createElement("div");
  box.id = "clb-banner";
  box.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#262421;color:#fff;" +
    "padding:12px 16px;border-radius:8px;font:14px sans-serif;box-shadow:0 4px 16px #0008;" +
    "display:flex;gap:10px;align-items:center";
  box.append("Game finished. ");

  const go = document.createElement("button");
  go.textContent = "Analyze on Lichess";
  go.style.cssText =
    "background:#81b64c;color:#fff;border:0;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:bold";
  go.onclick = async () => {
    try { await navigator.clipboard.writeText(pgn); } catch (_) {}
    browser.runtime.sendMessage({ type: "analyze", pgn });
    box.remove();
  };

  const close = document.createElement("button");
  close.textContent = "✕";
  close.title = "Dismiss";
  close.style.cssText = "background:none;color:#aaa;border:0;cursor:pointer";
  close.onclick = () => box.remove();

  box.append(go, close);
  document.body.appendChild(box);
}

async function poll() {
  if (busy || !/^\/(game|play|live)/.test(location.pathname)) return;
  busy = true;
  try {
    const user = await getUsername();
    if (!user) return;

    const res = await browser.runtime.sendMessage({ type: "latest", user });
    if (!res || !res.pgn) return;

    // Show the banner if the open page is the latest game,
    // or if a game ended after this page was opened.
    const m = location.pathname.match(/\/game\/(?:live|daily)\/(\d+)/);
    const isThisGame = !!(m && res.pgn.includes("/" + m[1]));
    if ((isThisGame || res.end_time > startedAt) && res.end_time > lastShown) {
      lastShown = res.end_time;
      try { await navigator.clipboard.writeText(res.pgn); } catch (_) {} // may need a user click; retried on button press
      showBanner(res.pgn);
    }
  } finally {
    busy = false;
  }
}

setTimeout(poll, 2000);
setInterval(poll, 10000);
