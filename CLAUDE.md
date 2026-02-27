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

Single-page app with three files at the root:

- **index.html** — Page structure
- **script.js** — Game logic, globe rendering, chicken animation, country data
- **style.css** — Styling and CSS animations

### Game Flow

A country name is displayed as a question → the player rotates the globe → the chicken flies down → feedback on whether the chicken landed on the correct country.

## Code Conventions

- Prettier for formatting (auto-format on save via VS Code workspace config)
- Google Fonts loaded via CSS: Playfair Display (serif headings), Poppins (sans-serif body)
