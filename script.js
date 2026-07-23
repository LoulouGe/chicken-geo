// ── UI Strings (multilanguage) ───────────────────────────────
const UI_STRINGS = {
  fr: {
    board_globe: "Globe 3D",
    board_map: "Carte",
    choose_board: "Choisis un plateau de jeu",
    choose_mode: "Choisis un mode de jeu",
    mode_continent: "Continent",
    mode_countries: "Pays",
    mode_capitals: "Capitales",
    choose_scope: "Choisis une zone",
    scope_world: "Monde",
    continent_europe: "Europe",
    continent_asie: "Asie",
    continent_afrique: "Afrique",
    continent_amerique_nord: "Amérique du Nord",
    continent_amerique_sud: "Amérique du Sud",
    continent_oceanie: "Océanie",
    back: "Retour",
    click_on: "Clique sur",
    end_title: "Partie terminée !",
    replay: "Rejouer",
    btn_retry_mistakes: "Rejoue tes erreurs",
    back_menu: "Retour au menu",
    load_error_msg:
      "Impossible de charger la carte. Vérifie ta connexion et recharge la page.",
  },
  en: {
    board_globe: "3D Globe",
    board_map: "Map",
    choose_board: "Choose a game board",
    choose_mode: "Choose a game mode",
    mode_continent: "Continent",
    mode_countries: "Countries",
    mode_capitals: "Capitals",
    choose_scope: "Choose an area",
    scope_world: "World",
    continent_europe: "Europe",
    continent_asie: "Asia",
    continent_afrique: "Africa",
    continent_amerique_nord: "North America",
    continent_amerique_sud: "South America",
    continent_oceanie: "Oceania",
    back: "Back",
    click_on: "Click on",
    end_title: "Game over!",
    replay: "Play again",
    btn_retry_mistakes: "Retry my mistakes",
    back_menu: "Back to menu",
    load_error_msg:
      "Could not load the map. Check your connection and reload the page.",
  },
  es: {
    board_globe: "Globo 3D",
    board_map: "Mapa",
    choose_board: "Elige un tablero de juego",
    choose_mode: "Elige un modo de juego",
    mode_continent: "Continente",
    mode_countries: "Países",
    mode_capitals: "Capitales",
    choose_scope: "Elige una zona",
    scope_world: "Mundo",
    continent_europe: "Europa",
    continent_asie: "Asia",
    continent_afrique: "África",
    continent_amerique_nord: "América del Norte",
    continent_amerique_sud: "América del Sur",
    continent_oceanie: "Oceanía",
    back: "Atrás",
    click_on: "Haz clic en",
    end_title: "¡Partida terminada!",
    replay: "Volver a jugar",
    btn_retry_mistakes: "Repite tus errores",
    back_menu: "Volver al menú",
    load_error_msg:
      "No se pudo cargar el mapa. Comprueba tu conexión y recarga la página.",
  },
};

function t(key) {
  return UI_STRINGS[currentLang][key];
}

// A country's name with its flag next to it (never used for capitals, which
// would give away the answer before the round is resolved).
function formatCountryLabel(cf) {
  return cf.flag ? cf.flag + " " + cf[currentLang].name : cf[currentLang].name;
}

// The current target's display name: a continent has no flag, a
// country/capital target is shown with its flag.
function formatTargetLabel(target) {
  if (currentMode === "continent") return t("continent_" + target);
  return formatCountryLabel(target);
}

function formatClickedLabel(clicked) {
  return formatCountryLabel(clicked);
}

// ── Constants ───────────────────────────────────────────────
const DEG = Math.PI / 180;
const CAM_Z = 2.2; // fixed camera distance — the globe stays already zoomed in, no animated dolly

const CONTINENTS = [
  "europe",
  "asie",
  "afrique",
  "amerique_nord",
  "amerique_sud",
  "oceanie",
];
// Flat single-color palette (matches Seterra: land is one uniform color,
// not colored per country/continent — the player must know borders/regions).
const LAND_COLOR = "#1e8346";
const LAND_HOVER = "#379050";
const OCEAN_COLOR = "#a9cdd6";
const BORDER_COLOR = "rgba(255,255,255,0.55)";

const CORRECT_FILL = "rgba(46,158,91,0.9)";
const CORRECT_GLOW = "rgba(80,230,140,0.9)";
const WRONG_FILL = "rgba(217,83,79,0.9)";
const WRONG_GLOW = "rgba(255,90,86,0.9)";

// Outcome tiers for the attempt-based scoring/coloring, à la Seterra: solved
// first try = white, 2nd try = yellow, 3rd try = darker yellow, given up
// (Skip or 3 wrong attempts) = red. The final score is the sum of points
// earned (out of 3 per target) over the max possible — so it's proportional
// to how many attempts each target took, not just a correct/incorrect count.
const TIER_COLORS = { 1: "#ffffff", 2: "#ffe066", 3: "#e0a800", 4: "#d9534f" };
const TIER_POINTS = { 1: 3, 2: 2, 3: 1, 4: 0 };

// A representative lon/lat used to recenter the board and place the
// persistent name label for a continent target — a continent has no single
// "centroid" polygon of its own.
const CONTINENT_CENTERS = {
  europe: { lon: 15, lat: 50 },
  asie: { lon: 90, lat: 45 },
  afrique: { lon: 20, lat: 2 },
  amerique_nord: { lon: -100, lat: 45 },
  amerique_sud: { lon: -60, lat: -15 },
  oceanie: { lon: 140, lat: -25 },
};

// ── State ───────────────────────────────────────────────────
let currentLang = "fr";
let currentBoard = "globe"; // "globe" | "map"
let currentMode = "countries"; // "continent" | "countries" | "capitals"
let currentScope = "world"; // "world" | continent slug
let countriesData = []; // loaded from countries.json

let geoData = null;
let countryFeatures = [];
let countryFeatureByName = new Map();

// Quiz session: one pass through every target in the scope (shuffled),
// staying on each question until answered correctly or skipped.
let quizOrder = [];
let quizIndex = 0;
let correctCount = 0;
let missedTargets = [];
let currentTarget = null; // country/capital: a countryFeature; continent mode: a continent/ocean slug string
let previousTarget = null;
let roundActive = false;
let quizActive = false;
let quizStartTime = 0;

// Attempt-based scoring: resets every round. 3 wrong attempts on the same
// target auto-reveals it (blinking red) instead of letting the player retry
// forever — the player must then click the revealed target to move on.
let wrongAttempts = 0;
let forcedReveal = false;
let forcedRevealBlinkTimer = null;
// answer-id (geoId / continent slug / ocean slug) -> outcome tier (1-4),
// kept for the whole quiz so every resolved target stays colored + labeled.
let targetOutcomes = new Map();
let scorePoints = 0; // sum of TIER_POINTS earned so far, out of quizOrder.length * 3

// Drag / rotation state
let dragging = false;
let dragPrev = { x: 0, y: 0 };

// Globe orientation as lon/lat/roll (keeps north up naturally)
let globeLon = 0; // Y-axis rotation (longitude)
let globeLat = 0.35; // X-axis rotation (latitude, initial tilt)
let globeRoll = 0; // Z-axis rotation (two-finger only)
let globeQuat = new THREE.Quaternion();
let velocityLon = 0,
  velocityLat = 0; // inertia (rad/frame)
const _globeEuler = new THREE.Euler();
const LAT_LIMIT = Math.PI / 2 - 0.01;

function updateGlobeQuat() {
  _globeEuler.set(globeLat, globeLon, globeRoll, "XYZ");
  globeQuat.setFromEuler(_globeEuler);
}

// Two-finger rotation state
let twoFingerAngle = null;
let velocityRoll = 0;

// Recenter animation state (used when skipping, globe only)
let recenterAnim = null;

// Three.js objects
let scene, camera, renderer;
let globeMesh, globeTexCanvas, globeTexCtx, globeTexture;
let baseTexCanvas, baseTexCtx;

// Flat 2D map (canvas, equirectangular/sinusoidal)
let mapCanvas, mapCtx;
let mapProjection = { minLon: -180, maxLon: 180, minLat: -85, maxLat: 85 };

const CONTINENT_BOUNDS = {
  europe: { minLon: -25, maxLon: 45, minLat: 34, maxLat: 72 },
  asie: { minLon: 25, maxLon: 180, minLat: -12, maxLat: 78 },
  afrique: { minLon: -20, maxLon: 52, minLat: -36, maxLat: 38 },
  amerique_nord: { minLon: -170, maxLon: -50, minLat: 5, maxLat: 75 },
  amerique_sud: { minLon: -82, maxLon: -33, minLat: -56, maxLat: 14 },
  oceanie: { minLon: 110, maxLon: 180, minLat: -50, maxLat: 0 },
};

// Reusable raycaster
const _raycaster = new THREE.Raycaster();

// ── Boot ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  // Register service worker for PWA functionality
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.log("Service Worker registration failed:", err);
    });
  }

  initThree();
  initMapCanvas();
  setupMapInput();

  window.addEventListener("resize", onResize);
  setupInput();
  setupMenuEvents();
  updateUIText();

  try {
    const [geoRes, countriesRes] = await Promise.all([
      fetch(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
      ),
      fetch("countries.json"),
    ]);
    geoData = await geoRes.json();
    countriesData = await countriesRes.json();
    indexCountries();
    buildBaseTexture();
    buildGlobeTexture();
  } catch (e) {
    console.error("Failed to load data:", e);
    document
      .querySelectorAll(".btn-pill")
      .forEach((b) => (b.disabled = true));
    const err = document.createElement("p");
    err.textContent = t("load_error_msg");
    err.style.color = "#d9534f";
    err.style.marginTop = "1rem";
    document.querySelector(".mode-buttons").appendChild(err);
  }

  requestAnimationFrame(renderLoop);
}

// ── Menu Events ─────────────────────────────────────────────
function setupMenuEvents() {
  // Language buttons
  document.querySelectorAll(".btn-lang").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      document
        .querySelectorAll(".btn-lang")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateUIText();
    });
  });

  // Board buttons (start screen): Globe 3D vs Carte
  document.querySelectorAll(".btn-board").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentBoard = btn.dataset.board;
      showScreen("mode-screen");
    });
  });

  // Mode buttons: Continent / Pays / Capitale
  document.querySelectorAll(".btn-mode-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      if (currentMode === "continent") {
        currentScope = "world";
        startGame();
      } else {
        showScreen("scope-screen");
      }
    });
  });

  // Scope buttons: Monde or a specific continent
  document.querySelectorAll(".btn-scope-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentScope = btn.dataset.scope;
      startGame();
    });
  });

  // Back buttons
  document
    .getElementById("btn-mode-back")
    .addEventListener("click", () => showScreen("start-screen"));
  document
    .getElementById("btn-scope-back")
    .addEventListener("click", () => showScreen("mode-screen"));

  // Replay / retry-mistakes / back-to-menu
  document.getElementById("btn-replay").addEventListener("click", startGame);
  document
    .getElementById("btn-retry-mistakes")
    .addEventListener("click", startRetryGame);
  document
    .getElementById("btn-back-menu")
    .addEventListener("click", () => showScreen("start-screen"));

  // Home / close button (visible during the game)
  document.getElementById("btn-home").addEventListener("click", () => {
    quizActive = false;
    roundActive = false;
    forcedReveal = false;
    stopForcedRevealBlink();
    recenterAnim = null;
    setHover(null);
    showScreen("start-screen");
  });

  // Skip button
  document.getElementById("btn-skip").addEventListener("click", handleSkip);
}

function updateUIText() {
  document.getElementById("btn-board-globe").textContent = t("board_globe");
  document.getElementById("btn-board-map").textContent = t("board_map");
  document.getElementById("start-subtitle").textContent = t("choose_board");

  document.getElementById("choose-mode-title").textContent = t("choose_mode");
  document.getElementById("btn-mode-continent").textContent =
    t("mode_continent");
  document.getElementById("btn-mode-countries").textContent =
    t("mode_countries");
  document.getElementById("btn-mode-capitals").textContent =
    t("mode_capitals");
  document.getElementById("btn-mode-back").textContent = t("back");

  document.getElementById("choose-scope-title").textContent =
    t("choose_scope");
  document.getElementById("btn-scope-world").textContent = t("scope_world");
  CONTINENTS.forEach((slug) => {
    document.getElementById("btn-scope-" + slug).textContent = t(
      "continent_" + slug,
    );
  });
  document.getElementById("btn-scope-back").textContent = t("back");

  document.getElementById("end-title").textContent = t("end_title");
  document.getElementById("btn-replay").textContent = t("replay");
  document.getElementById("btn-retry-mistakes").textContent = t(
    "btn_retry_mistakes",
  );
  document.getElementById("btn-back-menu").textContent = t("back_menu");
}

// ── Three.js Setup ──────────────────────────────────────────
function initThree() {
  const container = document.getElementById("scene-container");
  const w = window.innerWidth;
  const h = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent — CSS background shows through
  container.appendChild(renderer.domElement);

  // Lights. Kept deliberately dim: with no tone mapping set on the renderer,
  // light values over 1.0 just clip to pure white — ambient(0.75) +
  // directional(up to 0.6 at direct incidence) clipped the point on the
  // sphere most directly facing the light to white, which happened to be
  // the pole in some rotations, bleaching the Arctic/Antarctic ocean color
  // out and making that whole region look blank/missing.
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
  dirLight.position.set(5, 3, 8);
  scene.add(dirLight);

  // Globe geometry
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

  // Offscreen canvas for equirectangular texture
  globeTexCanvas = document.createElement("canvas");
  globeTexCanvas.width = 4096;
  globeTexCanvas.height = 2048;
  globeTexCtx = globeTexCanvas.getContext("2d");

  // Offscreen canvas for cached base layer (ocean + all countries)
  baseTexCanvas = document.createElement("canvas");
  baseTexCanvas.width = 4096;
  baseTexCanvas.height = 2048;
  baseTexCtx = baseTexCanvas.getContext("2d");

  globeTexture = new THREE.CanvasTexture(globeTexCanvas);
  globeTexture.minFilter = THREE.LinearFilter;
  globeTexture.magFilter = THREE.LinearFilter;

  // Lambert (diffuse-only, no specular): a specular highlight from the fixed
  // directional light would wash out whatever region of the globe happens to
  // face it as it rotates — including the pole, making the Arctic/Antarctic
  // look bleached-out/missing instead of showing the flat ocean color.
  const globeMat = new THREE.MeshLambertMaterial({
    map: globeTexture,
  });

  globeMesh = new THREE.Mesh(sphereGeo, globeMat);
  scene.add(globeMesh);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  sizeMapCanvas();
  if (currentBoard === "map" && geoData) {
    drawMapBase();
  }
}

// ── Shared Feature Rendering (globe texture + flat map) ─────

// Default equirectangular projection spanning the full world (used by the globe texture)
function defaultProj(lon, lat, w, h) {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
}

// Render a single feature's polygons onto a context. projFn defaults to the
// full-world equirectangular projection; the flat map passes a scoped one.
// glowColor, when set, draws a colored glow/outline in that color instead of
// the default thin border (used to reveal the correct/wrong answer).
function drawFeature(ctx, feature, w, h, color, glowColor, projFn) {
  const proj = projFn || defaultProj;
  const geom = feature.geometry;
  const polys =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.type === "MultiPolygon"
        ? geom.coordinates
        : [];

  for (const polygon of polys) {
    const ring = polygon[0];
    ctx.beginPath();
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = proj(ring[i][0], ring[i][1], w, h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (glowColor) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

// Draw every country in its normal (uniform) land color. Used to build the
// base layer, and to restore land after an ocean highlight (ocean regions
// are simple lon/lat shapes, not real coastlines, so they must never stay
// drawn on top of land).
function drawAllCountries(ctx, w, h, projFn) {
  for (const feature of geoData.features) {
    drawFeature(ctx, feature, w, h, LAND_COLOR, null, projFn);
  }
}

// Build the cached base texture (ocean + all countries), one flat color
// each, matching Seterra's plain map style. Called once per game start.
function buildBaseTexture() {
  if (!geoData) return;
  const ctx = baseTexCtx;
  const w = baseTexCanvas.width;
  const h = baseTexCanvas.height;

  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, 0, w, h);

  drawAllCountries(ctx, w, h, defaultProj);
}

// Build the visible globe texture. Blits the cached base then overdraws the
// correct answer in green and/or the player's wrong answer in red.
function buildGlobeTexture(correctAnswer, wrongAnswer) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

  ctx.drawImage(baseTexCanvas, 0, 0);
  drawPersistentOutcomes(ctx, w, h, defaultProj);
  drawAnswerHighlights(ctx, w, h, correctAnswer, wrongAnswer, defaultProj);

  globeTexture.needsUpdate = true;
}

// Every target already resolved this quiz stays tinted by its outcome tier
// (white/yellow/darker yellow/red) and labeled with its name for the rest of
// the quiz — a running "result map" like Seterra's own end-of-quiz review,
// built up live instead of only shown at the end.
function drawPersistentOutcomes(ctx, w, h, projFn) {
  for (const [answerId, tier] of targetOutcomes) {
    const color = TIER_COLORS[tier];
    for (const cf of countryFeatures) {
      if (cf.geoId === answerId || cf.continent === answerId) {
        drawFeature(ctx, cf.feature, w, h, color, null, projFn);
      }
    }
  }
  for (const answerId of targetOutcomes.keys()) {
    drawAnswerLabel(ctx, answerId, w, h, projFn);
  }
}

// A stable lon/lat anchor to place an answer's persistent name label: a
// country's real centroid, or a fixed representative point for a continent
// (which has no single polygon of its own).
function getLabelAnchor(answerId) {
  if (CONTINENT_CENTERS[answerId]) return CONTINENT_CENTERS[answerId];
  const cf = countryFeatureByName.get(answerId);
  return cf ? getCountryCentroid(cf) : null;
}

function labelTextForAnswerId(answerId) {
  if (currentMode === "continent") return formatTargetLabel(answerId);
  const cf = countryFeatureByName.get(answerId);
  return cf ? formatTargetLabel(cf) : answerId;
}

function drawAnswerLabel(ctx, answerId, w, h, projFn) {
  const anchor = getLabelAnchor(answerId);
  if (!anchor) return;
  const [x, y] = projFn(anchor.lon, anchor.lat, w, h);
  const fontSize = Math.round(h * 0.022);
  const text = labelTextForAnswerId(answerId);
  ctx.save();
  ctx.font = "700 " + fontSize + "px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(2, fontSize * 0.18);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#12213f";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Shared by the globe and the map: paint the correct-answer / wrong-answer
// highlight (a single country, or every country in a continent).
function drawAnswerHighlights(ctx, w, h, correctAnswer, wrongAnswer, projFn) {
  for (const cf of countryFeatures) {
    const isCorrect =
      correctAnswer && (cf.geoId === correctAnswer || cf.continent === correctAnswer);
    const isWrong =
      wrongAnswer && (cf.geoId === wrongAnswer || cf.continent === wrongAnswer);
    if (isCorrect) {
      drawFeature(ctx, cf.feature, w, h, CORRECT_FILL, CORRECT_GLOW, projFn);
    } else if (isWrong) {
      drawFeature(ctx, cf.feature, w, h, WRONG_FILL, WRONG_GLOW, projFn);
    }
  }
}

// Redraw the globe with just a hover highlight (lighter) — cosmetic-only
// feedback while the round is still active (before it resolves).
function applyGlobeHover(hoverCf) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

  ctx.drawImage(baseTexCanvas, 0, 0);
  drawPersistentOutcomes(ctx, w, h, defaultProj);
  if (hoverCf) {
    drawFeature(ctx, hoverCf.feature, w, h, LAND_HOVER, null);
  }
  globeTexture.needsUpdate = true;
}

// ── Index Countries ─────────────────────────────────────────
function indexCountries() {
  if (!geoData || !countriesData.length) return;
  const geoMap = new Map(countriesData.map((c) => [c.geoId, c]));
  countryFeatures = [];
  countryFeatureByName = new Map();
  for (const feature of geoData.features) {
    const entry = geoMap.get(feature.properties.name);
    if (entry) {
      const cf = { ...entry, feature };
      countryFeatures.push(cf);
      countryFeatureByName.set(feature.properties.name, cf);
    }
  }
}

function getFilteredCountryFeatures() {
  if (currentScope === "world") return countryFeatures;
  return countryFeatures.filter((cf) => cf.continent === currentScope);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuizPool() {
  if (currentMode === "continent") return [...CONTINENTS];
  return getFilteredCountryFeatures();
}

// Get a representative lon/lat centroid for a country/capital target, or a
// continent's fixed representative point (a continent has no centroid of
// its own).
function getCentroidForTarget(target) {
  if (!target) return null;
  if (currentMode === "continent") return CONTINENT_CENTERS[target] || null;
  return getCountryCentroid(target);
}

// Resolve a click: the country landed on, or null if it landed on water
// (there's no ocean quizzing/classification — a water click is just ignored).
function resolveClickAtLonLat(lon, lat) {
  return findCountryAtLonLat(lon, lat);
}

// ── Point-in-polygon ────────────────────────────────────────
function pointInPoly(poly, lon, lat) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    // Skip edges that cross the antimeridian (|Δlon| > 180)
    if (Math.abs(xi - xj) > 180) continue;
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findCountryAtLonLat(lon, lat) {
  for (const cf of countryFeatures) {
    const geom = cf.feature.geometry;
    if (geom.type === "Polygon") {
      if (pointInPoly(geom.coordinates[0], lon, lat)) return cf;
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        if (pointInPoly(poly[0], lon, lat)) return cf;
      }
    }
  }
  return null;
}

// Raycast from an arbitrary NDC point (screen click) into the globe and
// resolve which country lies underneath.
function getCountryAtNDC(ndc) {
  if (!geoData) return null;
  _raycaster.setFromCamera(ndc, camera);
  const hits = _raycaster.intersectObject(globeMesh);
  if (hits.length === 0) return null;

  const p = hits[0].point.clone();
  globeMesh.worldToLocal(p);
  p.normalize();

  const phi = Math.atan2(p.z, -p.x);
  let u = phi / (2 * Math.PI);
  if (u < 0) u += 1;
  const lon = u * 360 - 180;
  const lat = Math.asin(p.y) / DEG;

  return resolveClickAtLonLat(lon, lat);
}

function countryAtScreenPoint(x, y) {
  const ndc = new THREE.Vector2(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
  );
  return getCountryAtNDC(ndc);
}

// ── Hover feedback (globe + map) ──────────────────────────────
let hoveredCf = null;

function setHover(newHover) {
  if (newHover === hoveredCf) return;
  hoveredCf = newHover;
  if (!roundActive) return; // don't stomp on the correct/wrong reveal
  if (currentBoard === "globe") {
    applyGlobeHover(hoveredCf);
  } else {
    applyMapHover(hoveredCf);
  }
}

// ── Country centroid + recenter animation ────────────────────

// Signed area of a polygon ring (shoelace formula)
function ringSignedArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return area / 2;
}

// Centroid of a polygon ring using signed-area-weighted formula
function ringCentroid(ring) {
  let area = 0,
    cx = 0,
    cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const x0 = ring[j][0],
      y0 = ring[j][1];
    const x1 = ring[i][0],
      y1 = ring[i][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon: fall back to simple average
    let sx = 0,
      sy = 0;
    for (const c of ring) {
      sx += c[0];
      sy += c[1];
    }
    return { lon: sx / ring.length, lat: sy / ring.length };
  }
  return { lon: cx / (6 * area), lat: cy / (6 * area) };
}

function getCountryCentroid(cf) {
  const geom = cf.feature.geometry;
  const polys =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.type === "MultiPolygon"
        ? geom.coordinates
        : [];
  if (polys.length === 0) return null;

  // Find the polygon with the largest area and use its centroid
  let bestRing = null;
  let bestArea = -1;
  for (const poly of polys) {
    const ring = poly[0];
    const a = Math.abs(ringSignedArea(ring));
    if (a > bestArea) {
      bestArea = a;
      bestRing = ring;
    }
  }
  if (!bestRing) return null;
  return ringCentroid(bestRing);
}

function startRecenterAnimation(centroid) {
  if (!centroid) return;

  const targetLon = -(centroid.lon + 90) * DEG;
  const targetLat = centroid.lat * DEG;

  // Shortest-path for longitude
  let dLon = targetLon - globeLon;
  if (dLon > Math.PI) dLon -= 2 * Math.PI;
  if (dLon < -Math.PI) dLon += 2 * Math.PI;

  recenterAnim = {
    startTime: performance.now(),
    duration: 1500,
    fromLon: globeLon,
    toLon: globeLon + dLon,
    fromLat: globeLat,
    toLat: targetLat,
    fromRoll: globeRoll,
  };

  // Stop any inertia
  velocityLon = 0;
  velocityLat = 0;
  velocityRoll = 0;
}

// ── Flat Map (2D canvas, equirectangular/sinusoidal) ─────────
function initMapCanvas() {
  mapCanvas = document.getElementById("map-canvas");
  mapCtx = mapCanvas.getContext("2d");
  sizeMapCanvas();
}

function sizeMapCanvas() {
  if (!mapCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  mapCanvas.width = w * dpr;
  mapCanvas.height = h * dpr;
  mapCanvas.style.width = w + "px";
  mapCanvas.style.height = h + "px";
  mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// World bounds: -75°/85°, not a generous symmetric ±85° — a full ±85° wastes
// a huge empty band below Antarctica with no gameplay content (no country
// reaches that far south; the southernmost is Chile at ~-55.6°), which
// skewed the "cover" fit and squeezed the real content (Canada/Greenland/
// Russia, and Antarctica's own southern edge) toward the middle of the
// screen instead of Arctic-at-top/Antarctic-at-bottom like a real map.
function updateMapProjection() {
  mapProjection =
    currentScope === "world"
      ? { minLon: -180, maxLon: 180, minLat: -75, maxLat: 85 }
      : { ...CONTINENT_BOUNDS[currentScope] };
}

// Mercator y: standard conformal projection formula (radians in, radians out).
// Latitude is clipped to ±85° (mapProjection.minLat/maxLat for world scope)
// well short of ±90°, where Mercator's y diverges to infinity.
function mercatorY(latDeg) {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * DEG) / 2));
}

function mercatorYInv(y) {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;
}

// A bit of headroom on top of the strict "cover" scale below, so the map
// isn't cropped right at the edge of the viewport (more of each pole stays
// visible on wide screens) — the extra margin is just more ocean color,
// which already fills the whole canvas, so the map still reads as filling
// the screen edge to edge.
const MAP_ZOOM_OUT = 0.85;

// Fit the lon/lat bounds to fully cover the w×h canvas at a single uniform
// scale (no distortion, unlike stretching each axis independently) — like a
// CSS `background-size: cover`, so the shorter axis may crop slightly at the
// edges rather than leaving blank letterbox bars.
function getMapFit(w, h) {
  const boundsW = (mapProjection.maxLon - mapProjection.minLon) * DEG;
  const boundsH = mercatorY(mapProjection.maxLat) - mercatorY(mapProjection.minLat);
  const scale = Math.max(w / boundsW, h / boundsH) * MAP_ZOOM_OUT;
  return {
    scale,
    offsetX: (w - boundsW * scale) / 2,
    offsetY: (h - boundsH * scale) / 2,
  };
}

// Standard Mercator projection: straight vertical meridians, straight
// horizontal parallels — no curved/pinched poles like a sinusoidal
// projection. The globe's texture (defaultProj) stays plain equirectangular
// — that one wraps onto an actual sphere, which needs no flat-map correction.
// Latitude is clamped to the visible range before projecting: shapes that
// reach the actual pole (90°, e.g. the polar ocean caps) would otherwise
// hit mercatorY's ±Infinity asymptote and render as a broken/joined shape.
function mapProjFn(lon, lat, w, h) {
  const fit = getMapFit(w, h);
  const centerLonRad = ((mapProjection.minLon + mapProjection.maxLon) / 2) * DEG;
  const boundsW = (mapProjection.maxLon - mapProjection.minLon) * DEG;
  const clampedLat = Math.min(mapProjection.maxLat, Math.max(mapProjection.minLat, lat));
  const sx = lon * DEG - centerLonRad;
  const x = fit.offsetX + (sx + boundsW / 2) * fit.scale;
  const y = fit.offsetY + (mercatorY(mapProjection.maxLat) - mercatorY(clampedLat)) * fit.scale;
  return [x, y];
}

function drawMapBase() {
  if (!geoData || !mapCtx) return;
  updateMapProjection();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ctx = mapCtx;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, 0, w, h);

  drawAllCountries(ctx, w, h, mapProjFn);
  drawPersistentOutcomes(ctx, w, h, mapProjFn);
}

function drawMapOverlay(correctAnswer, wrongAnswer) {
  if (!geoData || !mapCtx) return;
  drawMapBase();
  const w = window.innerWidth;
  const h = window.innerHeight;
  drawAnswerHighlights(mapCtx, w, h, correctAnswer, wrongAnswer, mapProjFn);
}

// Redraw the map with just a hover highlight (lighter).
function applyMapHover(hoverCf) {
  if (!geoData || !mapCtx) return;
  drawMapBase();
  if (!hoverCf) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  drawFeature(mapCtx, hoverCf.feature, w, h, LAND_HOVER, null, mapProjFn);
}

function getCountryAtMapXY(px, py) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fit = getMapFit(w, h);
  const centerLonRad = ((mapProjection.minLon + mapProjection.maxLon) / 2) * DEG;
  const boundsW = (mapProjection.maxLon - mapProjection.minLon) * DEG;
  const yMerc = mercatorY(mapProjection.maxLat) - (py - fit.offsetY) / fit.scale;
  const lat = mercatorYInv(yMerc);
  const lonRad = (px - fit.offsetX) / fit.scale - boundsW / 2 + centerLonRad;
  const lon = lonRad / DEG;
  return resolveClickAtLonLat(lon, lat);
}

let isMapPressed = false;

function setupMapInput() {
  mapCanvas.addEventListener("mousemove", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    const rect = mapCanvas.getBoundingClientRect();
    setHover(getCountryAtMapXY(e.clientX - rect.left, e.clientY - rect.top));
  });

  mapCanvas.addEventListener("mousedown", () => {
    isMapPressed = true;
  });

  window.addEventListener("mouseup", () => {
    isMapPressed = false;
  });

  mapCanvas.addEventListener("mouseleave", () => {
    if (!isMapPressed) setHover(null);
  });

  mapCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (currentBoard !== "map" || !roundActive) return;
      const tt = e.touches[0];
      const rect = mapCanvas.getBoundingClientRect();
      setHover(getCountryAtMapXY(tt.clientX - rect.left, tt.clientY - rect.top));
    },
    { passive: true },
  );

  mapCanvas.addEventListener(
    "touchend",
    () => {
      setHover(null);
    },
    { passive: true },
  );

  mapCanvas.addEventListener("click", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    const rect = mapCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    handleAnswerClick(getCountryAtMapXY(px, py));
  });
}

// ── Screens ─────────────────────────────────────────────────
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function startGame() {
  missedTargets = [];
  targetOutcomes = new Map();
  scorePoints = 0;
  quizOrder = shuffle(buildQuizPool());
  quizIndex = 0;
  correctCount = 0;
  previousTarget = null;
  enterGameScreen();
}

function startRetryGame() {
  if (missedTargets.length === 0) return;
  quizOrder = shuffle(missedTargets.slice());
  missedTargets = [];
  targetOutcomes = new Map();
  scorePoints = 0;
  quizIndex = 0;
  correctCount = 0;
  previousTarget = null;
  enterGameScreen();
}

function enterGameScreen() {
  document
    .getElementById("scene-container")
    .classList.toggle("hidden", currentBoard !== "globe");
  document
    .getElementById("map-container")
    .classList.toggle("hidden", currentBoard !== "map");

  buildBaseTexture();
  quizActive = true;
  quizStartTime = performance.now();

  showScreen("game-screen");
  nextQuizItem();
}

function nextQuizItem() {
  if (quizIndex >= quizOrder.length) {
    endGame();
    return;
  }

  roundActive = true;
  hoveredCf = null;
  wrongAttempts = 0;
  forcedReveal = false;
  stopForcedRevealBlink();
  hideHint();
  hideWrongLabel();

  currentTarget = quizOrder[quizIndex];

  // Center the globe on the previous answer (or a random country for the
  // first question), without revealing the upcoming target.
  let centroid;
  if (!previousTarget) {
    const pool = getFilteredCountryFeatures();
    const startCountry = pool[Math.floor(Math.random() * pool.length)];
    centroid = startCountry ? getCountryCentroid(startCountry) : null;
  } else {
    centroid = getCentroidForTarget(previousTarget);
  }
  if (centroid) {
    globeLon = -(centroid.lon + 90) * DEG;
    globeLat = centroid.lat * DEG;
  } else {
    globeLon = 0;
    globeLat = 0.35;
  }
  globeRoll = 0;
  velocityLon = 0;
  velocityLat = 0;
  velocityRoll = 0;
  camera.position.set(0, 0, CAM_Z);

  updateHudQuestion();
  updateHudScore();

  if (currentBoard === "globe") {
    buildGlobeTexture();
  } else {
    drawMapBase();
  }
}

function updateHudQuestion() {
  const el = document.getElementById("hud-question");
  if (currentMode === "capitals") {
    // No flag here: the capital doesn't reveal the country, that's the point
    el.textContent = currentTarget[currentLang].capital;
  } else {
    el.textContent = formatTargetLabel(currentTarget);
  }
}

// The score is proportional to how many attempts each target took (3 points
// for a first-try correct answer, down to 0 for a given-up/failed one), not
// just a plain correct/incorrect count — so it climbs slower after mistakes.
function computeScorePct() {
  const total = quizOrder.length;
  if (!total) return 0;
  return Math.round((scorePoints / (total * 3)) * 100);
}

function updateHudScore() {
  document.getElementById("hud-score").textContent = computeScorePct() + "%";
}

function showHint() {
  const el = document.getElementById("hud-hint");
  el.innerHTML = t("click_on") + " <b>" + formatTargetLabel(currentTarget) + "</b>";
  el.classList.add("show");
}

function hideHint() {
  const el = document.getElementById("hud-hint");
  el.classList.remove("show");
  el.textContent = "";
}

let wrongLabelTimeout = null;

// Briefly names whatever the player actually clicked on a wrong guess, so
// they learn what that country/continent/ocean was — separate from the
// persistent "Clique sur X" hint, which keeps naming the real target.
function showWrongLabel(text) {
  const el = document.getElementById("hud-wrong-label");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(wrongLabelTimeout);
  wrongLabelTimeout = setTimeout(() => el.classList.remove("show"), 2000);
}

function hideWrongLabel() {
  clearTimeout(wrongLabelTimeout);
  document.getElementById("hud-wrong-label").classList.remove("show");
}

function endGame() {
  quizActive = false;
  roundActive = false;
  showScreen("end-screen");

  document.getElementById("end-title").textContent = t("end_title");
  document.getElementById("btn-replay").textContent = t("replay");
  document.getElementById("btn-back-menu").textContent = t("back_menu");

  document.getElementById("final-score").textContent = computeScorePct() + "%";

  const retryBtn = document.getElementById("btn-retry-mistakes");
  retryBtn.textContent = t("btn_retry_mistakes");
  retryBtn.classList.toggle("hidden", missedTargets.length === 0);
}

// ── Input Handling ──────────────────────────────────────────
function setupInput() {
  const container = document.getElementById("scene-container");

  let lastMoveTime = 0; // timestamp of last drag move event
  let downX = 0,
    downY = 0,
    downTime = 0; // for click-vs-drag detection

  function applyDragDelta(dx, dy) {
    const sensitivity = 0.005;
    globeLon -= dx * sensitivity;
    globeLat -= dy * sensitivity;
    globeLat = Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, globeLat));
    velocityLon = -dx * sensitivity;
    velocityLat = -dy * sensitivity;
    lastMoveTime = performance.now();
  }

  function killInertiaIfPaused() {
    // If the user paused before releasing, cancel inertia
    if (performance.now() - lastMoveTime > 60) {
      velocityLon = 0;
      velocityLat = 0;
    }
  }

  // A "clean" release (little movement, not held too long) resolves the
  // round by hit-testing the globe at that screen position. A drag just
  // rotates the globe and does not answer.
  function maybeResolveClick(x, y) {
    if (currentBoard !== "globe" || !roundActive || recenterAnim) return;
    const dist = Math.hypot(x - downX, y - downY);
    const elapsed = performance.now() - downTime;
    if (dist < 6 && elapsed < 500) {
      const ndc = new THREE.Vector2(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
      );
      handleAnswerClick(getCountryAtNDC(ndc));
    }
  }

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    dragPrev = { x: e.clientX, y: e.clientY };
    downX = e.clientX;
    downY = e.clientY;
    downTime = performance.now();
    velocityLon = 0;
    velocityLat = 0;
  });

  window.addEventListener("mouseup", (e) => {
    dragging = false;
    killInertiaIfPaused();
    maybeResolveClick(e.clientX, e.clientY);
  });

  window.addEventListener("mousemove", (e) => {
    if (dragging && !recenterAnim) {
      const dx = e.clientX - dragPrev.x;
      const dy = e.clientY - dragPrev.y;
      applyDragDelta(dx, dy);
      dragPrev = { x: e.clientX, y: e.clientY };
    }
    if (currentBoard !== "globe" || !roundActive || recenterAnim) return;
    if (dragging) {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      setHover(dist < 6 ? countryAtScreenPoint(e.clientX, e.clientY) : null);
    } else {
      setHover(countryAtScreenPoint(e.clientX, e.clientY));
    }
  });

  function getTwoFingerAngle(t0, t1) {
    return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
  }

  container.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        // Start two-finger roll — cancel single-finger drag
        dragging = false;
        twoFingerAngle = getTwoFingerAngle(e.touches[0], e.touches[1]);
        velocityRoll = 0;
      } else if (e.touches.length === 1 && twoFingerAngle === null) {
        dragging = true;
        dragPrev = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        downX = e.touches[0].clientX;
        downY = e.touches[0].clientY;
        downTime = performance.now();
        velocityLon = 0;
        velocityLat = 0;
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "touchend",
    (e) => {
      if (e.touches.length < 2) {
        twoFingerAngle = null;
      }
      if (e.touches.length === 0) {
        dragging = false;
        killInertiaIfPaused();
        const tt = e.changedTouches[0];
        if (tt) maybeResolveClick(tt.clientX, tt.clientY);
        setHover(null);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (recenterAnim) return;
      if (e.touches.length === 2 && twoFingerAngle !== null) {
        const newAngle = getTwoFingerAngle(e.touches[0], e.touches[1]);
        const deltaAngle = newAngle - twoFingerAngle;
        twoFingerAngle = newAngle;
        globeRoll += deltaAngle;
        velocityRoll = deltaAngle;
      } else if (dragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - dragPrev.x;
        const dy = e.touches[0].clientY - dragPrev.y;
        applyDragDelta(dx, dy);
        dragPrev = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    { passive: true },
  );
}

// ── Inertia ─────────────────────────────────────────────────
function applyInertia() {
  if (dragging || recenterAnim) return;
  if (velocityLon !== 0 || velocityLat !== 0) {
    globeLon += velocityLon;
    globeLat += velocityLat;
    globeLat = Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, globeLat));
    velocityLon *= 0.92;
    velocityLat *= 0.92;
    if (Math.abs(velocityLon) < 0.0001) velocityLon = 0;
    if (Math.abs(velocityLat) < 0.0001) velocityLat = 0;
  }
  if (twoFingerAngle === null && velocityRoll !== 0) {
    globeRoll += velocityRoll;
    velocityRoll *= 0.92;
    if (Math.abs(velocityRoll) < 0.0001) velocityRoll = 0;
  }
}

// ── North-up correction ─────────────────────────────────────
// Smoothly drives globeRoll toward zero.  Near the poles the
// constraint relaxes to allow free rotation.
function correctNorthUp() {
  if (recenterAnim) return;
  if (Math.abs(globeRoll) < 0.0001) {
    globeRoll = 0;
    return;
  }

  const absLatAngle = Math.abs(globeLat);
  const POLE_START = 58 * DEG; // begin relaxing
  const POLE_END = 82 * DEG; // fully relaxed

  let strength;
  if (absLatAngle < POLE_START) {
    strength = 1.0;
  } else if (absLatAngle > POLE_END) {
    strength = 0.0;
  } else {
    const tt = (absLatAngle - POLE_START) / (POLE_END - POLE_START);
    strength = 1.0 - tt * tt * (3 - 2 * tt); // smoothstep
  }

  globeRoll *= 1 - strength * 0.12;
}

// ── Elapsed-time stopwatch (counts up for the whole quiz) ────
function updateTimer() {
  if (!quizActive) return;
  const totalSec = Math.floor((performance.now() - quizStartTime) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  document.getElementById("hud-timer").textContent = mm + ":" + ss;
}

// ── Answer Resolution ─────────────────────────────────────────
// Entry point for both boards' click handlers.
function handleAnswerClick(clicked) {
  if (!roundActive) return;
  if (!clicked) return; // water click: ignored

  const isTarget =
    currentMode === "continent"
      ? clicked.continent === currentTarget
      : clicked.geoId === currentTarget.geoId;

  // After 3 wrong attempts, the target is revealed (blinking red) and the
  // round only ends once the player clicks specifically on it — any other
  // click just names what was clicked, same as a normal wrong guess.
  if (forcedReveal) {
    if (isTarget) confirmForcedReveal();
    else showWrongLabel(formatClickedLabel(clicked));
    return;
  }

  if (isTarget) {
    handleCorrect();
  } else {
    handleWrong(clicked);
  }
}

function targetAsAnswerId() {
  return currentMode === "continent" ? currentTarget : currentTarget.geoId;
}

function clickedAsAnswerId(clicked) {
  return currentMode === "continent" ? clicked.continent : clicked.geoId;
}

// Records the outcome tier for the current target: 1-3 by attempt count on
// success, or 4 when given up (Skip or 3 wrong attempts) — feeds both the
// persistent board coloring/labels and the attempt-weighted final score.
function recordOutcome(tier) {
  targetOutcomes.set(targetAsAnswerId(), tier);
  scorePoints += TIER_POINTS[tier];
}

function stopForcedRevealBlink() {
  if (forcedRevealBlinkTimer) {
    clearInterval(forcedRevealBlinkTimer);
    forcedRevealBlinkTimer = null;
  }
}

function handleCorrect() {
  roundActive = false;
  const tier = wrongAttempts === 0 ? 1 : wrongAttempts === 1 ? 2 : 3;
  recordOutcome(tier);
  correctCount++;
  updateHudScore();

  const overlay = document.getElementById("feedback-overlay");
  overlay.className = "correct";

  const correctAnswer = targetAsAnswerId();
  if (currentBoard === "globe") {
    buildGlobeTexture(correctAnswer, null);
  } else {
    drawMapOverlay(correctAnswer, null);
  }

  previousTarget = currentTarget;
  setTimeout(() => {
    overlay.className = "";
    quizIndex++;
    nextQuizItem();
  }, 500);
}

function handleWrong(clicked) {
  wrongAttempts++;

  const overlay = document.getElementById("feedback-overlay");
  overlay.className = "incorrect";
  const shakeTarget =
    currentBoard === "globe"
      ? document.getElementById("scene-container")
      : document.getElementById("map-container");
  shakeTarget.classList.add("shake");
  setTimeout(() => shakeTarget.classList.remove("shake"), 400);

  showWrongLabel(formatClickedLabel(clicked));

  if (wrongAttempts >= 3) {
    setTimeout(() => (overlay.className = ""), 500);
    triggerForcedReveal();
    return;
  }

  showHint();

  const wrongAnswer = clickedAsAnswerId(clicked);
  if (currentBoard === "globe") {
    buildGlobeTexture(null, wrongAnswer);
  } else {
    drawMapOverlay(null, wrongAnswer);
  }

  // Stay on the same question — just clear the red flash after a moment.
  setTimeout(() => {
    overlay.className = "";
    if (currentBoard === "globe") {
      buildGlobeTexture();
    } else {
      drawMapBase();
    }
  }, 500);
}

// After 3 wrong attempts: blink the target in red (reusing the "wrong"
// reveal color) until the player clicks specifically on it.
function triggerForcedReveal() {
  forcedReveal = true;
  hideHint();
  const correctAnswer = targetAsAnswerId();
  let on = false;
  stopForcedRevealBlink();
  forcedRevealBlinkTimer = setInterval(() => {
    on = !on;
    const highlightId = on ? correctAnswer : null;
    if (currentBoard === "globe") {
      buildGlobeTexture(null, highlightId);
    } else {
      drawMapOverlay(null, highlightId);
    }
  }, 400);
}

function confirmForcedReveal() {
  stopForcedRevealBlink();
  forcedReveal = false;
  roundActive = false;
  recordOutcome(4);
  missedTargets.push(currentTarget);
  updateHudScore();

  // Stays red (tier 4's color), not the usual green Skip reveal — this was
  // a failed round, just confirmed by clicking the now-obvious target.
  const correctAnswer = targetAsAnswerId();
  if (currentBoard === "globe") {
    buildGlobeTexture(null, correctAnswer);
  } else {
    drawMapOverlay(null, correctAnswer);
  }

  previousTarget = currentTarget;
  setTimeout(() => {
    quizIndex++;
    nextQuizItem();
  }, 700);
}

function handleSkip() {
  if (!roundActive) return;
  roundActive = false;
  forcedReveal = false;
  stopForcedRevealBlink();
  recordOutcome(4);
  updateHudScore();
  missedTargets.push(currentTarget);
  hideHint();
  hideWrongLabel();

  const correctAnswer = targetAsAnswerId();
  if (currentBoard === "globe") {
    buildGlobeTexture(correctAnswer, null);
    const recenterCentroid = getCentroidForTarget(currentTarget);
    if (recenterCentroid) startRecenterAnimation(recenterCentroid);
  } else {
    drawMapOverlay(correctAnswer, null);
  }

  previousTarget = currentTarget;
  setTimeout(() => {
    recenterAnim = null;
    quizIndex++;
    nextQuizItem();
  }, 900);
}

// ── Render Loop ─────────────────────────────────────────────
function renderLoop() {
  updateTimer();

  if (currentBoard === "globe") {
    applyInertia();
    correctNorthUp();

    // Recenter animation (on skip: interpolate lon/lat/roll to reveal answer)
    if (recenterAnim) {
      const elapsed = performance.now() - recenterAnim.startTime;
      const rt = Math.min(1, elapsed / recenterAnim.duration);
      // Ease-in-out cubic
      const e =
        rt < 0.5 ? 4 * rt * rt * rt : 1 - Math.pow(-2 * rt + 2, 3) / 2;

      globeLon =
        recenterAnim.fromLon +
        (recenterAnim.toLon - recenterAnim.fromLon) * e;
      globeLat =
        recenterAnim.fromLat +
        (recenterAnim.toLat - recenterAnim.fromLat) * e;
      globeRoll = recenterAnim.fromRoll * (1 - e);

      if (rt >= 1) {
        recenterAnim = null;
      }
    }

    // Build quaternion from lon/lat/roll and apply to globe mesh
    updateGlobeQuat();
    globeMesh.quaternion.copy(globeQuat);

    renderer.render(scene, camera);
  }

  requestAnimationFrame(renderLoop);
}
