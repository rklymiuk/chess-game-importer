// Background script: talks to the chess.com API and to Lichess.
// Requests are made here (not in the content script) to avoid page CORS restrictions.

browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === "latest") return latestGame(msg.user);
  if (msg.type === "analyze") return analyze(msg.pgn);
});

// Fetch the most recent game of `user` from the public chess.com API.
async function latestGame(user) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  try {
    const r = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/${y}/${m}`
    );
    if (!r.ok) return { error: "HTTP " + r.status };
    const { games } = await r.json();
    const g = games && games[games.length - 1];
    return g ? { pgn: g.pgn, end_time: g.end_time } : { error: "no games" };
  } catch (e) {
    return { error: String(e) };
  }
}

// Import the PGN into Lichess and open the analysis board.
// If the import is rejected, open the paste page and let lichess.js fill it in.
async function analyze(pgn) {
  try {
    const r = await fetch("https://lichess.org/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ pgn }),
    });
    const text = await r.text();
    console.log("[bridge] Lichess import", r.status, text.slice(0, 300));
    const j = JSON.parse(text);
    if (!j.url) throw new Error("no url in response");
    await browser.tabs.create({ url: j.url });
  } catch (e) {
    console.log("[bridge] Import failed, filling the paste page instead:", String(e));
    await browser.storage.local.set({ pendingPgn: pgn });
    await browser.tabs.create({ url: "https://lichess.org/paste" });
  }
}
