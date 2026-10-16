# Chess.com to Lichess Bridge

A small Firefox extension that removes the copy-and-paste step between **chess.com** and the **Lichess analysis board**.

When your game on chess.com ends, a banner appears with an **Analyze on Lichess** button. One click copies the game's PGN and opens it on Lichess, ready for engine analysis.

## Features

- Detects finished games automatically (via the public chess.com API, not page markup, so site redesigns don't break it).
- Works for live games and for an already finished game page you have open (`/game/live/<id>`).
- Copies the PGN to your clipboard and imports it into Lichess in one step.
- Fallback: if Lichess rejects the direct import, the Lichess paste page opens with the PGN already filled in.
- No account, no API keys, no tracking.

## Install

### Temporary (for testing)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select `manifest.json`.
3. It stays until Firefox restarts.

### Permanent

Sign the extension with Mozilla as a private (unlisted) add-on:

1. Go to <https://addons.mozilla.org/developers/> and choose **Submit a New Add-on**, then **On your own**.
2. Upload the `.zip` of this folder (with `manifest.json` at the root).
3. Download the signed `.xpi` and install it via `about:addons` → gear icon → **Install Add-on From File…**.

Each new upload needs a higher `version` in `manifest.json`. Requires Firefox 140 or newer.

## Usage

1. Open chess.com and play (or open a finished game at `/game/live/<id>`).
2. The first time, enter your chess.com username when asked. It is stored locally in the browser.
3. When the game ends, click **Analyze on Lichess** in the bottom-right banner.

The banner can take up to about 10 seconds to appear, because chess.com publishes finished games to its API with a short delay.

## How it works

| File | Role |
| --- | --- |
| `content.js` | Runs on chess.com. Polls for your latest game every 10 s and shows the banner. |
| `background.js` | Calls `api.chess.com` for the latest game and `lichess.org/api/import` to import the PGN. |
| `lichess.js` | Runs on `lichess.org/paste`. Fills in the PGN if the direct import failed. |

## Permissions and privacy

- `https://www.chess.com/*`, `https://api.chess.com/*`: detect and read your finished games.
- `https://lichess.org/*`: import the game and fill the paste page.
- `storage`: remember your chess.com username and a pending PGN (local only).
- `clipboardWrite`: copy the PGN.

The only data that leaves your browser is your chess.com username (sent to chess.com's own public API) and the PGN of the game you choose to analyze (sent to Lichess when you click the button). Nothing is sent to the author or any other third party, and no analytics are used. Because the game content is sent to Lichess, the manifest declares the `websiteContent` data-collection category.

## Troubleshooting

- **No banner:** open the console (F12) and look for `[bridge]` messages. Make sure the username you entered is correct (clear it with `browser.storage.local.clear()` from the extension's debugger console).
- **Lichess opens with an empty box:** reload the extension and try again. The paste fallback is filled only once per click.
- **Wrong game offered:** the extension offers your most recent game in the current month. Games from before the month rolled over are not looked up.

## Not affiliated

This is an independent project and is not affiliated with or endorsed by chess.com or Lichess.
