# Vertical Video Feed

Vanilla JS vertical short-video feed for mobile and desktop.  
No frameworks — only native browser APIs.

## Stack

- HTML5 / CSS3
- Vanilla JavaScript (ES modules)
- Node.js server
- Web APIs: `IntersectionObserver`, `scroll-snap`, `Page Visibility API`

## Quick start

```bash
npm install
npm start
```

Open `http://localhost:3000`

Videos are fetched dynamically from a [Google Drive folder](https://drive.google.com/drive/folders/1L5lsFtOUSaIFt0nzQgo7fbAezBc0nBh-).  
To authenticate, place your API key in `credentials.json`:

```json
{ "apiKey": "YOUR_GOOGLE_API_KEY" }
```

Or set `GOOGLE_API_KEY` environment variable.

## Project structure

```
src/
├── index.html
├── js/
│   ├── app.js              ← entry point, wires everything together
│   ├── components/
│   │   ├── VideoPlayer.js  ← per-video controls (play/pause, mute, progress)
│   │   ├── feedObserver.js ← active item tracking via IntersectionObserver
│   │   └── feedRenderer.js ← renders feed cards
│   ├── controls/
│   │   └── input.js        ← keyboard navigation & tab-visibility pause
│   ├── data/
│   │   └── videos.js       ← fetches video list (/api/videos)
│   └── ui/
│       └── playerUI.js     ← helpers (progress %, preload mode, button state)
└── styles/
    ├── base.css
    ├── feed.css
    └── player.css

server.mjs                  ← API (GET /api/videos) + static file server + video proxy
```

## Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm start`       | Run the server                        |
| `npm run check`   | Lint JS + check formatting + lint CSS |
| `npm run fix-all` | Auto-fix all lint & formatting issues |

## Features

- **Scroll-snap** vertical feed, one video per viewport
- **Single active playback** — observer picks the most visible card, only one video plays at a time
- **Play/pause** — tap the card or use buttons
- **Mute toggle**
- **Keyboard navigation** — `ArrowUp` / `ArrowDown`, `PageUp` / `PageDown`
- **Preload by distance** — active: `auto`, neighbours: `metadata`, far: `none`
- **Tab visibility** — pauses when the tab is hidden
- **Error handling** — per-video error fallback, dedicated empty state

</parameter>
