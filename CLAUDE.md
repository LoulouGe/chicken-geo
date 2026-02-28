# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Geography learning game built with a 12-year-old French-speaking daughter. A chicken flies down onto a rotating globe — the player must rotate the globe so the chicken lands on the country shown in the question. All user-facing text (UI, comments to the user, README) must be in French. Code identifiers and code comments can remain in English.

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
- **script.js** — Game logic, globe rendering, chicken animation, UI strings (i18n)
- **style.css** — Styling and CSS animations
- **countries.json** — 167 countries with geoId, flag emoji, and localized names/capitals (fr/en/es)

External libraries loaded via CDN (no npm/build):

- **Three.js r128** — 3D globe rendering (SphereGeometry + CanvasTexture), chicken sprite

### Globe Rotation

The globe orientation uses a **lon/lat/roll** model (not free quaternion) to keep north at the top of the screen. The roll component (two-finger only) is smoothly corrected toward zero away from the poles, with a smoothstep relaxation near the poles to avoid gimbal-lock artifacts.

Drag inertia is cancelled when the user pauses before releasing (>60 ms since last move), so careful positioning stops the globe immediately while flicks keep their momentum.

### Multilanguage & Game Modes

The game supports 3 languages (FR/EN/ES) and 3 modes:

- **Pays / Countries** — a country name is shown, find it on the globe
- **Drapeaux / Flags** — a flag emoji is shown, find the country
- **Capitales / Capitals** — a capital name is shown, find the country

UI strings are defined in the `UI_STRINGS` object in `script.js`. Country data (names, capitals) is localized per language in `countries.json`.

### Game Flow

A question is displayed (country name, flag, or capital depending on mode) → the player rotates the globe → the chicken dives down (shrinking toward the crosshair) → feedback on whether the chicken landed on the correct country. 5 rounds per game.

### Acceleration

The "Accelerate" button uses **progressive acceleration**: speed starts at 2× when pressed and ramps up to 8× over ~3 seconds of continuous hold. Releasing resets the ramp.

## Code Conventions

- Prettier for formatting (auto-format on save via VS Code workspace config)
- Google Fonts loaded via CSS: Playfair Display (serif headings), Poppins (sans-serif body)
