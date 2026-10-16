// Content script for lichess.org/paste.
// Fallback path: if the direct import was rejected, fill the PGN box so the user
// only has to press "Import game".

(async () => {
  const { pendingPgn } = await browser.storage.local.get("pendingPgn");
  if (!pendingPgn) return;

  const fill = () => {
    const ta = document.querySelector('textarea[name="pgn"]') || document.querySelector("textarea");
    if (!ta) return false;
    ta.value = pendingPgn;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    browser.storage.local.remove("pendingPgn");
    return true;
  };

  if (!fill()) {
    const timer = setInterval(() => { if (fill()) clearInterval(timer); }, 300);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
