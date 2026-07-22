# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Context

Geography learning game built with a 12-year-old French-speaking daughter, Seterra-style. The player picks a board (3D globe or flat 2D map), a mode (Continent / Countries / Capitals), and — for Countries/Capitals — a scope (World or a specific continent), then answers each round by clicking directly on the target on the board. All user-facing text (UI, comments to the user, README) must be in French. Code identifiers and code comments can remain in English.

## Development

No build tools, no package manager, no dependencies. Pure vanilla HTML/CSS/JS.

```bash
# Run local dev server
python3 -m http.server 8080
# Then open http://localhost:8080
```

Alternatively, use VS Code Live Server extension.

Deployed automatically via GitHub Pages from `main` branch — no build step needed.

## Architecture

Single-page app with four files at the root:

- **index.html** — Page structure
- **script.js** — Game logic, globe/map rendering, UI strings (i18n)
- **style.css** — Styling and CSS animations
- **countries.json** — 168 countries with geoId, continent, flag emoji, and localized names/capitals (fr/en/es)

External libraries loaded via CDN (no npm/build):

- **Three.js r128** — 3D globe rendering (SphereGeometry + CanvasTexture)

There is no mascot/character animation anywhere in the game (removed) — round feedback is just a colored overlay tint (green/red), confetti on a correct answer, and a shake + reveal of the correct answer on a miss.

The flat map is a plain 2D `<canvas>` reusing the same GeoJSON polygons and the same `pointInPoly` hit-testing as the globe — `drawFeature()` takes an optional projection function so the same rendering code draws both the full-world equirectangular globe texture and the (optionally continent-cropped) flat map. `getMapFit()` fits the current lon/lat bounds into the canvas at a single uniform scale (letterboxed/pillarboxed), so continents keep their true proportions instead of being stretched to fill the window — used identically for drawing and for click hit-testing so the two never drift apart.

### Globe Rotation & Camera

The globe orientation uses a **lon/lat/roll** model (not free quaternion) to keep north at the top of the screen. The roll component (two-finger only) is smoothly corrected toward zero away from the poles, with a smoothstep relaxation near the poles to avoid gimbal-lock artifacts.

Drag inertia is cancelled when the user pauses before releasing (>60 ms since last move), so careful positioning stops the globe immediately while flicks keep their momentum. The globe stays freely rotatable at all times — only a "clean" click/tap (small movement, released quickly) resolves the round; a drag never counts as an answer.

The camera sits at a single fixed distance (`CAM_Z`) at all times — there is no zoom/dolly animation (not on round start, not while waiting for a click, not on the recenter-after-a-miss animation, which only interpolates lon/lat/roll).

### Multilanguage, Boards, Modes & Scope

The game supports 3 languages (FR/EN/ES), 2 boards, 3 modes, and (for two of the modes) a scope filter:

- **Boards**: Globe 3D or Carte (flat 2D map)
- **Continent et Océans** — a continent OR ocean name is shown; click any country belonging to it, or the matching ocean. Oceans have no polygon data — `OCEAN_REGIONS` defines 5 oceans as simple lon/lat rectangles (Pacific split in two across the antimeridian), and `oceanAtLonLat()`/`resolveClickAtLonLat()` classify a click by these rules when it doesn't land on a country. Because ocean "regions" are rectangles, not real coastlines, `drawAllCountries()` must be redrawn on top after any ocean highlight/reveal, or the rectangle would paint over neighboring land.
- **Pays / Countries** — a country name is shown, click it
- **Capitales / Capitals** — a capital name is shown, click its country
- **Scope** (Pays/Capitales only, skipped for Continent) — Monde (world) or a specific continent, filtering the target pool via `getFilteredCountryFeatures()`

UI strings are defined in the `UI_STRINGS` object in `script.js`. Country data (names, capitals, continent) is localized/keyed per language in `countries.json`.

### Game Flow

A question is displayed (continent, country name, or capital depending on mode) → the player clicks/taps directly on the answer on the board (globe or map) → feedback on whether the click was correct, with the correct answer revealed on a miss. A visible timer bar paces each round; if it runs out with no click, the round auto-resolves as a miss. 5 rounds per game (or fewer/more when replaying only past mistakes — see below).

### Mistake Retry & Score

At the end of a game, the player sees a percentage (score / rounds) and, if any round was missed, a "Rejoue tes erreurs" button that replays a shorter game built only from `missedTargets` — the same board/mode/scope as the game just played.

## Code Conventions

- Prettier for formatting (auto-format on save via VS Code workspace config)
- Google Fonts loaded via CSS: Baloo 2 (rounded cartoon headings), Nunito (sans-serif body)
- Cartoon kid-friendly visual style (bright colors, thick dark outlines via `-webkit-text-stroke`/canvas strokes) — no mascot/character, just a plain SVG Earth illustration on the start screen
