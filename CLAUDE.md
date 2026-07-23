# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

"Geo Quiz" — a geography learning game built with a 12-year-old French-speaking daughter. It is a deliberate, faithful clone of Seterra (seterra.com): same visual style (navy HUD bar, flat single-color land/ocean, bold italic Poppins typography), same "stay on question until correct" mechanic, same layout — the 3D globe is the one intentional addition beyond a strict Seterra clone. The player picks a board (3D globe or flat 2D map), a mode (Continent / Pays / Capitales), and — for Pays/Capitales — a scope (Monde or a specific continent), then answers each round by clicking directly on the target on the board. All user-facing text (UI, comments to the user, README) must be in French. Code identifiers and code comments can remain in English.

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

There is no mascot/character animation anywhere in the game (removed). Visual style is flat and Seterra-like, not cartoon: a single flat green (`LAND_COLOR`) for all land, a single pale blue-gray (`OCEAN_COLOR`) for all water, thin white country borders, no textures/gradients/decorations. Round feedback is a colored overlay tint (green/red) plus a shake on a miss; the correct/wrong answer is highlighted directly on the board (`CORRECT_FILL`/`WRONG_FILL`) rather than via a separate reveal step.

The flat map is a plain 2D `<canvas>` reusing the same GeoJSON polygons and the same `pointInPoly` hit-testing as the globe — `drawFeature()` takes an optional projection function so the same rendering code draws both the full-world equirectangular globe texture and the (optionally continent-cropped) flat map. The map itself uses a true Mercator projection (`mapProjFn`/`mercatorY`/`mercatorYInv`), fit to the canvas via `getMapFit()`'s single **uniform** scale chosen as `max(w/boundsW, h/boundsH) * MAP_ZOOM_OUT` — a "cover" fit (like CSS `background-size: cover`) with a bit of extra zoom-out margin: the map always fills the canvas edge to edge with no letterbox bars, cropping slightly at the shorter axis instead of stretching non-uniformly (which would distort country shapes horizontally). Used identically for drawing and for click hit-testing (`getCountryAtMapXY`) so the two never drift apart. Latitude is clamped to the visible range before projecting (`mapProjFn`), since Mercator's `y` diverges to infinity at ±90°. The world scope's `minLat`/`maxLat` (in `updateMapProjection()`) are `-75`/`85`, not a generous symmetric ±85° — a full ±85° wastes a huge empty band below Antarctica with no gameplay content (the southernmost country is Chile at ~-55.6°, and Antarctica has no country to quiz on), which skewed the "cover" fit and squeezed the real content (Canada/Greenland/Russia, Antarctica's own edge) toward the middle instead of Arctic-at-top/Antarctic-at-bottom like a real map.

### Globe Rotation & Camera

The globe orientation uses a **lon/lat/roll** model (not free quaternion) to keep north at the top of the screen. The roll component (two-finger only) is smoothly corrected toward zero away from the poles, with a smoothstep relaxation near the poles to avoid gimbal-lock artifacts.

Drag inertia is cancelled when the user pauses before releasing (>60 ms since last move), so careful positioning stops the globe immediately while flicks keep their momentum. The globe stays freely rotatable at all times — only a "clean" click/tap (small movement, released quickly) resolves the round; a drag never counts as an answer.

The camera sits at a single fixed distance (`CAM_Z`) at all times — there is no zoom/dolly animation (not on round start, not while waiting for a click, not on the recenter-after-a-miss animation, which only interpolates lon/lat/roll).

### Multilanguage, Boards, Modes & Scope

The game supports 3 languages (FR/EN/ES), 2 boards, 3 modes, and (for two of the modes) a scope filter:

- **Boards**: Globe 3D or Carte (flat 2D map)
- **Continent** — a continent name is shown; click any country belonging to it (`clicked.continent === currentTarget`). No oceans, no water-region classification — a water click is just ignored like in every other mode. There's no scope screen for this mode: choosing it starts a quiz directly with `currentScope = "world"` and `buildQuizPool()` returning all 6 `CONTINENTS` slugs.
- **Pays / Countries** — a country name is shown, click it
- **Capitales / Capitals** — a capital name is shown, click its country
- **Scope** (Pays/Capitales only) — Monde (world) or a specific continent, filtering the target pool via `getFilteredCountryFeatures()`

UI strings are defined in the `UI_STRINGS` object in `script.js`. Country data (names, capitals, continent) is localized/keyed per language in `countries.json`.

### Game Flow (Seterra mechanic: stay on question until correct, capped at 3 attempts)

A quiz is one full pass through the target pool (`buildQuizPool()`): all 6 continents for Continent mode, or all filtered countries for Pays/Capitales — shuffled once at quiz start (`quizOrder`), not re-randomized per round. The HUD shows a running score pill (just a percentage, see below), the current question, an up-counting elapsed-time stopwatch (`updateTimer()`, no countdown/auto-fail), a Skip button, and a home/close button.

- **Correct click** (`handleCorrect()`) — green flash, advances to the next item in `quizOrder`, records an outcome tier (1/2/3, see below) based on `wrongAttempts` so far.
- **Wrong click** (`handleWrong()`) — red flash + shake, names whatever was actually clicked for ~2s (`showWrongLabel()`/`#hud-wrong-label`, via `formatClickedLabel()`), shows a hint tooltip ("Clique sur *Target*") under the HUD — but the round does **not** advance, the player must find the right answer. `wrongAttempts` increments each time.
- **3rd wrong attempt** (`triggerForcedReveal()`) — instead of another retry, the target starts blinking red (`forcedRevealBlinkTimer`, an interval toggling the "wrong" reveal color) until the player clicks specifically on it; any other click just names what was clicked, same as a normal miss. Clicking the blinking target (`confirmForcedReveal()`) locks it solid red, adds it to `missedTargets`, and advances — this is the only other way (besides Skip) a round counts as missed.
- **Skip** (`handleSkip()`, also bound to the icon button) — reveals the correct answer, adds the target to `missedTargets`, then advances.
- **Water click** — ignored, no penalty, round continues.

### Persistent Outcome Coloring, Labels & Score

Every resolved target (correct, force-revealed, or skipped) is recorded in `targetOutcomes` (a `Map` from answer-id — a geoId, or a continent slug in Continent mode — to outcome tier: 1 = correct first try, 2 = correct 2nd try, 3 = correct 3rd try, 4 = given up) via `recordOutcome()`, and stays that way for the rest of the quiz — `drawPersistentOutcomes()` redraws every entry in its `TIER_COLORS` shade (white/yellow/darker yellow/red) with its name permanently labeled (`drawAnswerLabel()`, using a country's real centroid or a fixed `CONTINENT_CENTERS` anchor for a continent target), building up a running Seterra-style "result map" as the quiz progresses, on both boards. In Continent mode a correct/tier color fills every country belonging to that continent (`cf.continent === answerId`), not just one country.

The score is **not** a plain correct/incorrect ratio: `computeScorePct()` sums each target's `TIER_POINTS` (3/2/1/0) and divides by `quizOrder.length * 3`, so it's proportional to how many attempts everything took. Only a percentage is ever shown (HUD score pill and end screen) — never a raw "X / Y" fraction.

### Mistake Retry

At the end of a quiz (`endGame()`), if `missedTargets` isn't empty, a "Rejoue tes erreurs" button starts a new quiz whose `quizOrder` is built only from `missedTargets` (`startRetryGame()`) — same board/mode/scope as the quiz just played, with `targetOutcomes`/`scorePoints` reset. Once that retry quiz ends, `missedTargets` resets and a plain "Rejouer" goes back to the full pool.

## Code Conventions

- Prettier for formatting (auto-format on save via VS Code workspace config)
- Google Fonts loaded via CSS: Poppins (bold italic, Seterra-style headings/HUD/buttons)
- Flat, Seterra-style visual design — no mascot/character, no decorative illustrations, no confetti; feedback is limited to overlay tint + shake + inline highlight on the board itself
