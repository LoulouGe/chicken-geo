# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Context

"Geo Quiz" — a geography learning game built with a 12-year-old French-speaking daughter. It is a deliberate, faithful clone of Seterra (seterra.com): same visual style (navy HUD bar, flat single-color land/ocean, bold italic Poppins typography), same "stay on question until correct" mechanic, same layout — the 3D globe is the one intentional addition beyond a strict Seterra clone. The player picks a board (3D globe or flat 2D map), a mode (Continent et Océans / Pays / Capitales), and — for Pays/Capitales — a scope (Monde or a specific continent), then answers each round by clicking directly on the target on the board. All user-facing text (UI, comments to the user, README) must be in French. Code identifiers and code comments can remain in English.

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

The flat map is a plain 2D `<canvas>` reusing the same GeoJSON polygons and the same `pointInPoly` hit-testing as the globe — `drawFeature()` takes an optional projection function so the same rendering code draws both the full-world equirectangular globe texture and the (optionally continent-cropped) flat map. `getMapFit()` fits the current lon/lat bounds into the canvas at a single uniform scale (letterboxed/pillarboxed), so continents keep their true proportions instead of being stretched to fill the window — used identically for drawing and for click hit-testing so the two never drift apart.

### Globe Rotation & Camera

The globe orientation uses a **lon/lat/roll** model (not free quaternion) to keep north at the top of the screen. The roll component (two-finger only) is smoothly corrected toward zero away from the poles, with a smoothstep relaxation near the poles to avoid gimbal-lock artifacts.

Drag inertia is cancelled when the user pauses before releasing (>60 ms since last move), so careful positioning stops the globe immediately while flicks keep their momentum. The globe stays freely rotatable at all times — only a "clean" click/tap (small movement, released quickly) resolves the round; a drag never counts as an answer.

The camera sits at a single fixed distance (`CAM_Z`) at all times — there is no zoom/dolly animation (not on round start, not while waiting for a click, not on the recenter-after-a-miss animation, which only interpolates lon/lat/roll).

### Multilanguage, Boards, Modes & Scope

The game supports 3 languages (FR/EN/ES), 2 boards, 3 modes, and (for two of the modes) a scope filter:

- **Boards**: Globe 3D or Carte (flat 2D map)
- **Continent et Océans** — a continent OR ocean name is shown; click any country belonging to it, or the matching ocean. Oceans have no polygon data — `OCEAN_REGIONS` hand-draws 5 oceans as lon/lat polygon rings bent at major capes/straits (Panama, Cape Horn, Cape of Good Hope, Indonesia), with the Pacific split into two ring entries across the antimeridian; the polar caps (Arctique/Austral) instead use a wavy latitude threshold (`waveLat()`/`ARCTIC_WAVE`/`AUSTRAL_WAVE`) since a ring enclosing a pole needs special handling. `oceanAtLonLat()`/`resolveClickAtLonLat()` classify a click by these rules when it doesn't land on a country. Because ocean regions aren't real coastlines, `drawAllCountries()` must be redrawn on top after any ocean highlight, or it would paint over neighboring land.
- **Pays / Countries** — a country name is shown, click it
- **Capitales / Capitals** — a capital name is shown, click its country
- **Scope** (Pays/Capitales only, skipped for Continent et Océans) — Monde (world) or a specific continent, filtering the target pool via `getFilteredCountryFeatures()`

UI strings are defined in the `UI_STRINGS` object in `script.js`. Country data (names, capitals, continent) is localized/keyed per language in `countries.json`.

### Game Flow (Seterra mechanic: stay on question until correct)

A quiz is one full pass through the target pool (`buildQuizPool()`): all filtered countries for Pays/Capitales, or all 6 continents + 5 oceans for Continent et Océans — shuffled once at quiz start (`quizOrder`), not re-randomized per round. The HUD shows a running score pill (`correctCount / quizOrder.length · pct%`), the current question, an up-counting elapsed-time stopwatch (`updateTimer()`, no countdown/auto-fail), a Skip button, and a home/close button.

- **Correct click** (`handleCorrect()`) — green flash, advances to the next item in `quizOrder`, `correctCount++`.
- **Wrong click** (`handleWrong()`) — red flash + shake, shows a hint tooltip ("Clique sur *Target*") under the HUD, briefly highlights the wrong pick — but the round does **not** advance and the target is **not** added to `missedTargets`; the player must find the right answer.
- **Skip** (`handleSkip()`, also bound to the icon button) — reveals the correct answer in green, adds the target to `missedTargets`, then advances. This is the only way a round counts as missed.
- **Water click outside Continent et Océans** — ignored, no penalty, round continues.

### Mistake Retry & Score

At the end of a quiz (`endGame()`), the player sees `correctCount / total (pct%)` and, if `missedTargets` isn't empty, a "Rejoue tes erreurs" button that starts a new quiz whose `quizOrder` is built only from `missedTargets` (`startRetryGame()`) — same board/mode/scope as the quiz just played. Once that retry quiz ends, `missedTargets` resets and a plain "Rejouer" goes back to the full pool.

## Code Conventions

- Prettier for formatting (auto-format on save via VS Code workspace config)
- Google Fonts loaded via CSS: Poppins (bold italic, Seterra-style headings/HUD/buttons)
- Flat, Seterra-style visual design — no mascot/character, no decorative illustrations, no confetti; feedback is limited to overlay tint + shake + inline highlight on the board itself
