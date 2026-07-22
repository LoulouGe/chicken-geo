// ── UI Strings (multilanguage) ───────────────────────────────
const UI_STRINGS = {
  fr: {
    board_globe: "Globe 3D",
    board_map: "Carte",
    choose_mode: "Choisis un mode de jeu",
    mode_continent: "Continent et Océans",
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
    ocean_pacifique: "Océan Pacifique",
    ocean_atlantique: "Océan Atlantique",
    ocean_indien: "Océan Indien",
    ocean_arctique: "Océan Arctique",
    ocean_austral: "Océan Austral",
    back: "Retour",
    subtitle_continent: "Clique sur le continent ou l'océan !",
    subtitle_countries: "Clique sur le bon pays !",
    subtitle_capitals: "Clique sur le pays de cette capitale !",
    question: "Question",
    correct_answer_was: "La bonne réponse : ",
    you_clicked: "Tu as cliqué : ",
    end_title: "Partie terminée !",
    replay: "Rejouer",
    btn_retry_mistakes: "Rejoue tes erreurs",
    back_menu: "Retour au menu",
    score_amazing: "Incroyable ! ",
    score_good: "Bien joué ! ",
    score_try: "Continue de t’entraîner ! ",
    load_error_btn: "Erreur de chargement",
    load_error_msg:
      "Impossible de charger la carte. Vérifie ta connexion et recharge la page.",
  },
  en: {
    board_globe: "3D Globe",
    board_map: "Map",
    choose_mode: "Choose a game mode",
    mode_continent: "Continent & Oceans",
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
    ocean_pacifique: "Pacific Ocean",
    ocean_atlantique: "Atlantic Ocean",
    ocean_indien: "Indian Ocean",
    ocean_arctique: "Arctic Ocean",
    ocean_austral: "Southern Ocean",
    back: "Back",
    subtitle_continent: "Click on the continent or ocean!",
    subtitle_countries: "Click on the right country!",
    subtitle_capitals: "Click on the country of this capital!",
    question: "Question",
    correct_answer_was: "Correct answer: ",
    you_clicked: "You clicked: ",
    end_title: "Game over!",
    replay: "Play again",
    btn_retry_mistakes: "Retry my mistakes",
    back_menu: "Back to menu",
    score_amazing: "Amazing! ",
    score_good: "Well done! ",
    score_try: "Keep practising! ",
    load_error_btn: "Loading error",
    load_error_msg:
      "Could not load the map. Check your connection and reload the page.",
  },
  es: {
    board_globe: "Globo 3D",
    board_map: "Mapa",
    choose_mode: "Elige un modo de juego",
    mode_continent: "Continente y Océanos",
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
    ocean_pacifique: "Océano Pacífico",
    ocean_atlantique: "Océano Atlántico",
    ocean_indien: "Océano Índico",
    ocean_arctique: "Océano Ártico",
    ocean_austral: "Océano Austral",
    back: "Atrás",
    subtitle_continent: "¡Haz clic en el continente o el océano!",
    subtitle_countries: "¡Haz clic en el país correcto!",
    subtitle_capitals: "¡Haz clic en el país de esta capital!",
    question: "Pregunta",
    correct_answer_was: "Respuesta correcta: ",
    you_clicked: "Has hecho clic en: ",
    end_title: "¡Partida terminada!",
    replay: "Volver a jugar",
    btn_retry_mistakes: "Repite tus errores",
    back_menu: "Volver al menú",
    score_amazing: "¡Increíble! ",
    score_good: "¡Bien jugado! ",
    score_try: "¡Sigue practicando! ",
    load_error_btn: "Error de carga",
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

// The current target's display name: a continent/ocean has no flag, a
// country/capital target is shown with its flag.
function formatTargetLabel(target) {
  if (currentMode === "continent") {
    return OCEANS.includes(target) ? t("ocean_" + target) : t("continent_" + target);
  }
  return formatCountryLabel(target);
}

// A clicked answer can be a country object (Pays/Capitales, or a country
// clicked in Continent mode) or a plain ocean slug string (water clicked in
// Continent mode).
function formatClickedLabel(clicked) {
  if (typeof clicked === "string") return t("ocean_" + clicked);
  return formatCountryLabel(clicked);
}

// ── Constants ───────────────────────────────────────────────
const MAX_ROUNDS = 5;
const ROUND_TIME = 18; // seconds — pacing only, resolution is click-driven
const DEG = Math.PI / 180;

const CAM_Z = 2.2; // fixed camera distance — the globe stays already zoomed in, no animated dolly

const CONTINENT_COLORS = {
  europe: "#7fd8be",
  asie: "#ffb74d",
  afrique: "#ffe066",
  amerique_nord: "#8bd17c",
  amerique_sud: "#ff8fa3",
  oceanie: "#b39ddb",
};
const CONTINENTS = Object.keys(CONTINENT_COLORS);

const OCEAN_COLORS = {
  pacifique: "#4fc3f7",
  atlantique: "#29b6f6",
  indien: "#26c6da",
  arctique: "#81d4fa",
  austral: "#4dd0e1",
};
const OCEANS = Object.keys(OCEAN_COLORS);

// Ocean regions defined by simple lon/lat rectangles (no polygon data
// exists for oceans) — the Pacific wraps the antimeridian, so it's split
// into two rectangles sharing the same slug.
const OCEAN_REGIONS = [
  { slug: "arctique", minLon: -180, maxLon: 180, minLat: 66, maxLat: 90 },
  { slug: "austral", minLon: -180, maxLon: 180, minLat: -90, maxLat: -60 },
  { slug: "atlantique", minLon: -70, maxLon: 20, minLat: -60, maxLat: 66 },
  { slug: "indien", minLon: 20, maxLon: 145, minLat: -60, maxLat: 66 },
  { slug: "pacifique", minLon: 145, maxLon: 180, minLat: -60, maxLat: 66 },
  { slug: "pacifique", minLon: -180, maxLon: -70, minLat: -60, maxLat: 66 },
];

// A representative lon/lat used to recenter the globe on an ocean answer.
const OCEAN_CENTERS = {
  pacifique: { lon: 180, lat: 0 },
  atlantique: { lon: -25, lat: 10 },
  indien: { lon: 75, lat: -10 },
  arctique: { lon: 0, lat: 80 },
  austral: { lon: 0, lat: -75 },
};

function oceanAtLonLat(lon, lat) {
  for (const r of OCEAN_REGIONS) {
    if (lon >= r.minLon && lon <= r.maxLon && lat >= r.minLat && lat <= r.maxLat) {
      return r.slug;
    }
  }
  return "pacifique";
}

// ── State ───────────────────────────────────────────────────
let currentLang = "fr";
let currentBoard = "globe"; // "globe" | "map"
let currentMode = "countries"; // "continent" | "countries" | "capitals"
let currentScope = "world"; // "world" | continent slug
let countriesData = []; // loaded from countries.json

let geoData = null;
let countryFeatures = [];
let countryFeatureByName = new Map();

let score = 0;
let round = 0;
let roundsThisGame = MAX_ROUNDS;
let currentTarget = null; // country/capital: a countryFeature; continent: a continent slug string
let previousTarget = null;
let missedTargets = []; // targets missed this game
let retryPool = null; // when set, nextRound draws sequentially from this instead of random

let roundActive = false;
let timerAccum = 0; // accumulated virtual time (seconds)
let lastTimerTick = 0; // real timestamp of last timer update

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

// Recenter animation state (used on wrong answer, globe only)
let recenterAnim = null;

// Three.js objects
let scene, camera, renderer;
let globeMesh, globeTexCanvas, globeTexCtx, globeTexture;
let baseTexCanvas, baseTexCtx;

// Particles overlay (2D confetti, shared by both boards)
let particlesCanvas, particlesCtx;
let particles = [];

// Flat 2D map (canvas, equirectangular)
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

// Country candy colors (bright, cartoon-style palette)
const PASTEL_COLORS = [
  "#7fd8be",
  "#ffb74d",
  "#90caf9",
  "#ff8fa3",
  "#b39ddb",
  "#ffe066",
  "#80deea",
  "#f48fb1",
  "#aed581",
  "#ffcc80",
  "#81a4e0",
  "#f06292",
  "#a5d6a7",
  "#ffd54f",
  "#4dd0e1",
  "#ce93d8",
];

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

  particlesCanvas = document.getElementById("particles-canvas");
  particlesCtx = particlesCanvas.getContext("2d");
  sizeParticlesCanvas();

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
    buildBaseTexture(currentMode);
    buildGlobeTexture();
  } catch (e) {
    console.error("Failed to load data:", e);
    document
      .querySelectorAll(".btn-mode")
      .forEach((b) => (b.disabled = true));
    const err = document.createElement("p");
    err.textContent = t("load_error_msg");
    err.style.color = "#ff6b6b";
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

  // Home button (visible during the game)
  document.getElementById("btn-home").addEventListener("click", () => {
    roundActive = false;
    recenterAnim = null;
    hoveredCf = null;
    pressedCf = null;
    showScreen("start-screen");
  });
}

function updateUIText() {
  document.getElementById("btn-board-globe").textContent = t("board_globe");
  document.getElementById("btn-board-map").textContent = t("board_map");

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

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 3, 8);
  scene.add(dirLight);
  // Subtle back light for rim effect
  const backLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  backLight.position.set(-3, -2, -5);
  scene.add(backLight);

  // Globe geometry
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

  // Offscreen canvas for equirectangular texture
  globeTexCanvas = document.createElement("canvas");
  globeTexCanvas.width = 4096;
  globeTexCanvas.height = 2048;
  globeTexCtx = globeTexCanvas.getContext("2d");

  // Offscreen canvas for cached base layer (ocean + grid + all countries)
  baseTexCanvas = document.createElement("canvas");
  baseTexCanvas.width = 4096;
  baseTexCanvas.height = 2048;
  baseTexCtx = baseTexCanvas.getContext("2d");

  globeTexture = new THREE.CanvasTexture(globeTexCanvas);
  globeTexture.minFilter = THREE.LinearFilter;
  globeTexture.magFilter = THREE.LinearFilter;

  const globeMat = new THREE.MeshPhongMaterial({
    map: globeTexture,
    specular: 0x222222,
    shininess: 15,
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
  sizeParticlesCanvas();
  sizeMapCanvas();
  if (currentBoard === "map" && geoData) {
    drawMapBase();
  }
}

function sizeParticlesCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  particlesCanvas.width = w * dpr;
  particlesCanvas.height = h * dpr;
  particlesCanvas.style.width = w + "px";
  particlesCanvas.style.height = h + "px";
  particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Shared Feature Rendering (globe texture + flat map) ─────

// Default equirectangular projection spanning the full world (used by the globe texture)
function defaultProj(lon, lat, w, h) {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
}

// Render a single feature's polygons onto a context. projFn defaults to the
// full-world equirectangular projection; the flat map passes a scoped one.
// glowColor, when set, draws a colored glow/outline in that color instead of
// the default thin border (used to reveal the correct answer in green / the
// wrong answer in red).
function drawFeature(ctx, feature, w, h, color, glowColor, noStroke, projFn) {
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
      ctx.shadowBlur = 30;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    } else if (!noStroke) {
      ctx.strokeStyle = "rgba(43,33,64,0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

const CORRECT_FILL = "rgba(40,180,99,0.9)";
const CORRECT_GLOW = "rgba(80,230,140,0.9)";
const WRONG_FILL = "rgba(220,40,40,0.9)";
const WRONG_GLOW = "rgba(255,60,60,0.9)";

// Pixel rect (in the current projection) covered by an ocean region.
function oceanRegionPixelRect(region, w, h, projFn) {
  const [x1, y1] = projFn(region.minLon, region.maxLat, w, h);
  const [x2, y2] = projFn(region.maxLon, region.minLat, w, h);
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

// Fill + outline each ocean region in its own color (Continent mode only —
// countries/capitals modes just use a single flat ocean color/gradient).
function fillOceanRegions(ctx, w, h, projFn) {
  for (const region of OCEAN_REGIONS) {
    const r = oceanRegionPixelRect(region, w, h, projFn);
    ctx.fillStyle = OCEAN_COLORS[region.slug];
    ctx.fillRect(r.left, r.top, r.width, r.height);
  }
  ctx.strokeStyle = "rgba(43,33,64,0.85)";
  ctx.lineWidth = 2;
  for (const region of OCEAN_REGIONS) {
    const r = oceanRegionPixelRect(region, w, h, projFn);
    ctx.strokeRect(r.left, r.top, r.width, r.height);
  }
}

// Highlight (green/red reveal) every rect belonging to an ocean slug.
function highlightOceanRegion(ctx, w, h, slug, fillColor, glowColor, projFn) {
  for (const region of OCEAN_REGIONS) {
    if (region.slug !== slug) continue;
    const r = oceanRegionPixelRect(region, w, h, projFn);
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;
    ctx.fillStyle = fillColor;
    ctx.fillRect(r.left, r.top, r.width, r.height);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(r.left, r.top, r.width, r.height);
    ctx.restore();
  }
}

// A single cartoon wave doodle centered at (x, y).
function drawWaveMark(ctx, x, y, halfWidth) {
  ctx.beginPath();
  ctx.moveTo(x - halfWidth, y);
  ctx.quadraticCurveTo(x - halfWidth * 0.5, y - halfWidth * 0.45, x, y);
  ctx.quadraticCurveTo(x + halfWidth * 0.5, y + halfWidth * 0.45, x + halfWidth, y);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(1, halfWidth * 0.22);
  ctx.lineCap = "round";
  ctx.stroke();
}

// Scatter wave doodles across the ocean (skipping land) within lon/lat
// bounds — the full world for the globe, or the map's current scope.
function drawWaves(ctx, w, h, projFn, waveSize, bounds) {
  const b = bounds || { minLon: -180, maxLon: 180, minLat: -85, maxLat: 85 };
  const lonStep = 16;
  const latStep = 13;
  for (let lat = b.minLat + latStep / 2; lat < b.maxLat; lat += latStep) {
    for (let lon = b.minLon + lonStep / 2; lon < b.maxLon; lon += lonStep) {
      if (findCountryAtLonLat(lon, lat)) continue;
      const [x, y] = projFn(lon, lat, w, h);
      drawWaveMark(ctx, x, y, waveSize);
    }
  }
}

// Draw every country in its normal (non-highlighted) color. Used to build
// the base layer, and to restore land that an ocean rectangle's bounding
// box would otherwise cover (ocean regions are plain lon/lat rects, not
// real coastline polygons, so they must never stay drawn on top of land).
function drawAllCountries(ctx, w, h, projFn) {
  const continentMode = currentMode === "continent";
  let featureIdx = 0;
  for (const feature of geoData.features) {
    const cf = countryFeatureByName.get(feature.properties.name);
    let color;
    if (cf) {
      color = cf.baseColor;
    } else {
      color = continentMode ? "#7a8a99" : PASTEL_COLORS[featureIdx % PASTEL_COLORS.length];
    }
    drawFeature(ctx, feature, w, h, color, null, false, projFn);
    featureIdx++;
  }
}

// Build the cached base texture (ocean + grid + all countries).
// Called once per game start (palette depends on mode).
function buildBaseTexture(mode) {
  if (!geoData) return;
  const ctx = baseTexCtx;
  const w = baseTexCanvas.width;
  const h = baseTexCanvas.height;
  const continentMode = mode === "continent";

  // Ocean: one region per ocean in Continent mode, a flat gradient otherwise
  if (continentMode) {
    fillOceanRegions(ctx, w, h, defaultProj);
  } else {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0, "#4fc3f7");
    oceanGrad.addColorStop(0.5, "#29b6f6");
    oceanGrad.addColorStop(1, "#0288d1");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.5;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const x = ((lon + 180) / 360) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Cartoon wave doodles scattered across the ocean (skips land)
  drawWaves(ctx, w, h, defaultProj, 26);

  // Assign + cache each clickable country's base color once per game start,
  // reused later for hover/press button-style highlighting and by the map.
  countryFeatures.forEach((cf, idx) => {
    cf.baseColor = continentMode
      ? CONTINENT_COLORS[cf.continent]
      : PASTEL_COLORS[idx % PASTEL_COLORS.length];
  });

  // Draw all countries: pastel per-country, or shared continent color in
  // Continent mode. A fine border is always drawn — in Continent mode this
  // also traces each continent's outer silhouette.
  let featureIdx = 0;
  for (const feature of geoData.features) {
    const cf = countryFeatureByName.get(feature.properties.name);
    let color;
    if (cf) {
      color = cf.baseColor;
    } else {
      color = continentMode ? "#7a8a99" : PASTEL_COLORS[featureIdx % PASTEL_COLORS.length];
    }
    drawFeature(ctx, feature, w, h, color, null, false);
    featureIdx++;
  }
}

// Group a country with its continent-mates when in Continent mode (so
// hover/press/reveal highlight the whole continent block, not one country).
function getHighlightGroup(cf) {
  if (!cf) return [];
  if (currentMode === "continent") {
    return countryFeatures.filter((c) => c.continent === cf.continent);
  }
  return [cf];
}

// Lighten (amt > 0) or darken (amt < 0) a "#rrggbb" color.
function adjustColor(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  const channels = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff].map(
    (c) =>
      Math.max(
        0,
        Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))),
      ),
  );
  return `rgb(${channels.join(",")})`;
}

const HOVER_GLOW = "rgba(255,255,255,0.55)";
const PRESS_GLOW = "rgba(0,0,0,0.45)";
const HOVER_LIGHTEN = 0.22;
const PRESS_DARKEN = -0.28;

// Build the visible globe texture. Blits the cached base then overdraws the
// correct answer in green (a single country, or every country in a
// continent) and, on a miss, the player's wrong answer in red.
function buildGlobeTexture(correctAnswer, wrongAnswer) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

  ctx.drawImage(baseTexCanvas, 0, 0);

  const correctIsOcean = correctAnswer && OCEANS.includes(correctAnswer);
  const wrongIsOcean = wrongAnswer && OCEANS.includes(wrongAnswer);
  if (correctIsOcean) {
    highlightOceanRegion(ctx, w, h, correctAnswer, CORRECT_FILL, CORRECT_GLOW, defaultProj);
  }
  if (wrongIsOcean) {
    highlightOceanRegion(ctx, w, h, wrongAnswer, WRONG_FILL, WRONG_GLOW, defaultProj);
  }
  if (correctIsOcean || wrongIsOcean) {
    // Ocean regions are plain lon/lat rectangles, not real coastlines —
    // restore any land that fell inside the highlighted rectangle(s).
    drawAllCountries(ctx, w, h, defaultProj);
  }

  for (const cf of countryFeatures) {
    const isCorrect =
      correctAnswer &&
      !OCEANS.includes(correctAnswer) &&
      (currentMode === "continent"
        ? cf.continent === correctAnswer
        : cf.geoId === correctAnswer);
    const isWrong =
      wrongAnswer &&
      !OCEANS.includes(wrongAnswer) &&
      (currentMode === "continent"
        ? cf.continent === wrongAnswer
        : cf.geoId === wrongAnswer);
    if (isCorrect) {
      drawFeature(ctx, cf.feature, w, h, CORRECT_FILL, CORRECT_GLOW);
    } else if (isWrong) {
      drawFeature(ctx, cf.feature, w, h, WRONG_FILL, WRONG_GLOW);
    }
  }

  globeTexture.needsUpdate = true;
}

// Redraw the globe with a hover highlight (lighter, "raised") and/or a press
// highlight (darker, "sunken") — purely cosmetic button-style feedback while
// the round is still active (before the round resolves).
function applyGlobeHoverPress(hoverCf, pressCf) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

  ctx.drawImage(baseTexCanvas, 0, 0);

  for (const cf of getHighlightGroup(hoverCf)) {
    drawFeature(ctx, cf.feature, w, h, adjustColor(cf.baseColor, HOVER_LIGHTEN), HOVER_GLOW);
  }
  for (const cf of getHighlightGroup(pressCf)) {
    drawFeature(ctx, cf.feature, w, h, adjustColor(cf.baseColor, PRESS_DARKEN), PRESS_GLOW);
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

function pickCountryInContinent(slug) {
  const pool = countryFeatures.filter((cf) => cf.continent === slug);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function pickRandomTarget() {
  if (retryPool && retryPool.length > 0) {
    return retryPool[round - 1];
  }
  if (currentMode === "continent") {
    const pool = [...CONTINENTS, ...OCEANS];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const pool = getFilteredCountryFeatures();
  return pool[Math.floor(Math.random() * pool.length)];
}

// Get a representative lon/lat centroid for any target: a country/capital
// target (a countryFeature), or — in Continent mode — a continent (via one
// of its countries) or an ocean (a fixed representative point).
function getCentroidForTarget(target) {
  if (!target) return null;
  if (currentMode === "continent") {
    if (OCEANS.includes(target)) return OCEAN_CENTERS[target] || null;
    const cf = pickCountryInContinent(target);
    return cf ? getCountryCentroid(cf) : null;
  }
  return getCountryCentroid(target);
}

// Resolve a click: a country if it landed on land; in Continent mode, an
// ocean slug (plain string) if it landed on water instead.
function resolveClickAtLonLat(lon, lat) {
  const cf = findCountryAtLonLat(lon, lat);
  if (cf) return cf;
  if (currentMode === "continent") return oceanAtLonLat(lon, lat);
  return null;
}

function isContinentModeCorrect(clicked, target) {
  if (!clicked) return false;
  if (typeof clicked === "string") return clicked === target; // clicked an ocean
  return clicked.continent === target; // clicked a country
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

// ── Hover / press button-style feedback (globe + map) ────────
let hoveredCf = null;
let pressedCf = null;

function setHoverPress(newHover, newPress) {
  if (newHover === hoveredCf && newPress === pressedCf) return;
  hoveredCf = newHover;
  pressedCf = newPress;
  redrawBoardHighlight();
}

function redrawBoardHighlight() {
  if (!roundActive) return; // don't stomp on the correct/wrong reveal
  if (currentBoard === "globe") {
    applyGlobeHoverPress(hoveredCf, pressedCf);
  } else {
    applyMapHoverPress(hoveredCf, pressedCf);
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
    duration: 2000,
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

// ── Flat Map (2D canvas, equirectangular) ───────────────────
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

function updateMapProjection() {
  mapProjection =
    currentScope === "world"
      ? { minLon: -180, maxLon: 180, minLat: -85, maxLat: 85 }
      : { ...CONTINENT_BOUNDS[currentScope] };
}

// Fit the lon/lat bounds into a w×h canvas at a single uniform scale
// (letterboxed/pillarboxed rather than stretched), so continents keep their
// true proportions instead of being squashed to fill the window.
function getMapFit(w, h) {
  const boundsW = mapProjection.maxLon - mapProjection.minLon;
  const boundsH = mapProjection.maxLat - mapProjection.minLat;
  const scale = Math.min(w / boundsW, h / boundsH);
  return {
    scale,
    offsetX: (w - boundsW * scale) / 2,
    offsetY: (h - boundsH * scale) / 2,
  };
}

function mapProjFn(lon, lat, w, h) {
  const fit = getMapFit(w, h);
  const x = fit.offsetX + (lon - mapProjection.minLon) * fit.scale;
  const y = fit.offsetY + (mapProjection.maxLat - lat) * fit.scale;
  return [x, y];
}

function drawMapBase() {
  if (!geoData || !mapCtx) return;
  updateMapProjection();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ctx = mapCtx;

  ctx.clearRect(0, 0, w, h);
  const continentMode = currentMode === "continent";

  if (continentMode) {
    fillOceanRegions(ctx, w, h, mapProjFn);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#4fc3f7");
    grad.addColorStop(0.5, "#29b6f6");
    grad.addColorStop(1, "#0288d1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawWaves(ctx, w, h, mapProjFn, 8, mapProjection);

  let featureIdx = 0;
  for (const feature of geoData.features) {
    const cf = countryFeatureByName.get(feature.properties.name);
    let color;
    if (cf) {
      color = cf.baseColor;
    } else {
      color = continentMode ? "#7a8a99" : PASTEL_COLORS[featureIdx % PASTEL_COLORS.length];
    }
    drawFeature(ctx, feature, w, h, color, null, false, mapProjFn);
    featureIdx++;
  }
}

function drawMapOverlay(correctAnswer, wrongAnswer) {
  if (!geoData || !mapCtx) return;
  drawMapBase();
  const w = window.innerWidth;
  const h = window.innerHeight;

  const correctIsOcean = correctAnswer && OCEANS.includes(correctAnswer);
  const wrongIsOcean = wrongAnswer && OCEANS.includes(wrongAnswer);
  if (correctIsOcean) {
    highlightOceanRegion(mapCtx, w, h, correctAnswer, CORRECT_FILL, CORRECT_GLOW, mapProjFn);
  }
  if (wrongIsOcean) {
    highlightOceanRegion(mapCtx, w, h, wrongAnswer, WRONG_FILL, WRONG_GLOW, mapProjFn);
  }
  if (correctIsOcean || wrongIsOcean) {
    drawAllCountries(mapCtx, w, h, mapProjFn);
  }

  for (const cf of countryFeatures) {
    const isCorrect =
      correctAnswer &&
      !OCEANS.includes(correctAnswer) &&
      (currentMode === "continent"
        ? cf.continent === correctAnswer
        : cf.geoId === correctAnswer);
    const isWrong =
      wrongAnswer &&
      !OCEANS.includes(wrongAnswer) &&
      (currentMode === "continent"
        ? cf.continent === wrongAnswer
        : cf.geoId === wrongAnswer);
    if (isCorrect) {
      drawFeature(mapCtx, cf.feature, w, h, CORRECT_FILL, CORRECT_GLOW, false, mapProjFn);
    } else if (isWrong) {
      drawFeature(mapCtx, cf.feature, w, h, WRONG_FILL, WRONG_GLOW, false, mapProjFn);
    }
  }
}

// Redraw the map with a hover highlight (lighter) and/or a press highlight
// (darker) — the map equivalent of applyGlobeHoverPress.
function applyMapHoverPress(hoverCf, pressCf) {
  if (!geoData || !mapCtx) return;
  drawMapBase();
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const cf of getHighlightGroup(hoverCf)) {
    drawFeature(mapCtx, cf.feature, w, h, adjustColor(cf.baseColor, HOVER_LIGHTEN), HOVER_GLOW, false, mapProjFn);
  }
  for (const cf of getHighlightGroup(pressCf)) {
    drawFeature(mapCtx, cf.feature, w, h, adjustColor(cf.baseColor, PRESS_DARKEN), PRESS_GLOW, false, mapProjFn);
  }
}

function getCountryAtMapXY(px, py) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fit = getMapFit(w, h);
  const lon = mapProjection.minLon + (px - fit.offsetX) / fit.scale;
  const lat = mapProjection.maxLat - (py - fit.offsetY) / fit.scale;
  return resolveClickAtLonLat(lon, lat);
}

let isMapPressed = false;

function setupMapInput() {
  mapCanvas.addEventListener("mousemove", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    const rect = mapCanvas.getBoundingClientRect();
    const cf = getCountryAtMapXY(e.clientX - rect.left, e.clientY - rect.top);
    setHoverPress(cf, isMapPressed ? cf : null);
  });

  mapCanvas.addEventListener("mousedown", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    isMapPressed = true;
    const rect = mapCanvas.getBoundingClientRect();
    const cf = getCountryAtMapXY(e.clientX - rect.left, e.clientY - rect.top);
    setHoverPress(cf, cf);
  });

  window.addEventListener("mouseup", () => {
    isMapPressed = false;
  });

  mapCanvas.addEventListener("mouseleave", () => {
    if (!isMapPressed) setHoverPress(null, null);
  });

  mapCanvas.addEventListener("touchstart", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    const t = e.touches[0];
    const rect = mapCanvas.getBoundingClientRect();
    const cf = getCountryAtMapXY(t.clientX - rect.left, t.clientY - rect.top);
    setHoverPress(cf, cf);
  }, { passive: true });

  mapCanvas.addEventListener("touchend", () => {
    setHoverPress(null, null);
  }, { passive: true });

  mapCanvas.addEventListener("click", (e) => {
    if (currentBoard !== "map" || !roundActive) return;
    const rect = mapCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    handleAnswerClick(getCountryAtMapXY(px, py));
    setHoverPress(null, null);
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
  score = 0;
  round = 0;
  missedTargets = [];
  roundsThisGame = MAX_ROUNDS;
  retryPool = null;
  enterGameScreen();
}

function startRetryGame() {
  if (missedTargets.length === 0) return;
  retryPool = missedTargets.slice();
  roundsThisGame = retryPool.length;
  score = 0;
  round = 0;
  missedTargets = [];
  enterGameScreen();
}

function enterGameScreen() {
  document
    .getElementById("scene-container")
    .classList.toggle("hidden", currentBoard !== "globe");
  document
    .getElementById("map-container")
    .classList.toggle("hidden", currentBoard !== "map");

  buildBaseTexture(currentMode);

  showScreen("game-screen");
  nextRound();
}

function nextRound() {
  if (round >= roundsThisGame) {
    endGame();
    return;
  }

  round++;
  roundActive = true;
  timerAccum = 0;
  lastTimerTick = performance.now();
  hoveredCf = null;
  pressedCf = null;

  currentTarget = pickRandomTarget();

  // Center the globe on the previous answer (or a random country for round 1),
  // without revealing the upcoming target.
  let centroid;
  if (round === 1) {
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

  // Display question based on mode
  const nameEl = document.getElementById("country-name");
  const subtitleEl = document.getElementById("game-subtitle");

  if (currentMode === "continent") {
    nameEl.textContent = t("continent_" + currentTarget);
    subtitleEl.textContent = t("subtitle_continent");
  } else if (currentMode === "capitals") {
    // No flag here: the capital doesn't reveal the country, that's the point
    nameEl.textContent = currentTarget[currentLang].capital;
    subtitleEl.textContent = t("subtitle_capitals");
  } else {
    nameEl.textContent = formatCountryLabel(currentTarget);
    subtitleEl.textContent = t("subtitle_countries");
  }

  document.getElementById("score-display").textContent =
    t("question") + " " + round + " / " + roundsThisGame;

  const labelEl = document.getElementById("feedback-label");
  labelEl.classList.remove("show");
  labelEl.textContent = "";

  // Reset timer
  const bar = document.getElementById("timer-bar");
  bar.style.width = "100%";
  bar.classList.remove("warning");

  // Reset board to plain (no highlight)
  if (currentBoard === "globe") {
    buildGlobeTexture();
  } else {
    drawMapBase();
  }
}

function endGame() {
  roundActive = false;
  showScreen("end-screen");

  document.getElementById("end-title").textContent = t("end_title");
  document.getElementById("btn-replay").textContent = t("replay");
  document.getElementById("btn-back-menu").textContent = t("back_menu");

  const pct = Math.round((score / roundsThisGame) * 100);
  let msg;
  if (pct >= 80) msg = t("score_amazing");
  else if (pct >= 60) msg = t("score_good");
  else msg = t("score_try");

  document.getElementById("final-score").textContent =
    msg + score + " / " + roundsThisGame + " — " + pct + "%";

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
    if (currentBoard === "globe" && roundActive && !recenterAnim) {
      const cf = countryAtScreenPoint(e.clientX, e.clientY);
      setHoverPress(cf, cf);
    }
  });

  window.addEventListener("mouseup", (e) => {
    dragging = false;
    killInertiaIfPaused();
    maybeResolveClick(e.clientX, e.clientY);
    setHoverPress(null, null);
  });

  window.addEventListener("mousemove", (e) => {
    if (dragging && !recenterAnim) {
      const dx = e.clientX - dragPrev.x;
      const dy = e.clientY - dragPrev.y;
      applyDragDelta(dx, dy);
      dragPrev = { x: e.clientX, y: e.clientY };
    }
    if (currentBoard !== "globe" || !roundActive || recenterAnim) return;
    const cf = countryAtScreenPoint(e.clientX, e.clientY);
    if (dragging) {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      setHoverPress(cf, dist < 6 ? cf : null);
    } else {
      setHoverPress(cf, null);
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
        if (currentBoard === "globe" && roundActive && !recenterAnim) {
          const cf = countryAtScreenPoint(downX, downY);
          setHoverPress(cf, cf);
        }
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
        setHoverPress(null, null);
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
        if (currentBoard === "globe" && roundActive) {
          const dist = Math.hypot(
            e.touches[0].clientX - downX,
            e.touches[0].clientY - downY,
          );
          const cf =
            dist < 6 ? countryAtScreenPoint(downX, downY) : null;
          setHoverPress(cf, cf);
        }
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

// ── Timer (pacing only) & Answer Resolution ─────────────────
function updateTimer() {
  if (!roundActive) return;

  const now = performance.now();
  const realDelta = (now - lastTimerTick) / 1000;
  lastTimerTick = now;

  timerAccum += realDelta;

  const remaining = Math.max(0, ROUND_TIME - timerAccum);
  const frac = remaining / ROUND_TIME;

  const bar = document.getElementById("timer-bar");
  bar.style.width = frac * 100 + "%";
  bar.classList.toggle("warning", frac < 0.4);

  if (remaining <= 0) {
    resolveRound(null);
  }
}

// Entry point for both boards' click handlers.
function handleAnswerClick(clickedCountry) {
  if (!roundActive) return;
  if (!clickedCountry) return; // water click outside Continent mode: ignored, round continues
  resolveRound(clickedCountry);
}

function resolveRound(clickedCountry) {
  previousTarget = currentTarget;
  roundActive = false;

  const correct =
    currentMode === "continent"
      ? isContinentModeCorrect(clickedCountry, currentTarget)
      : !!clickedCountry && clickedCountry.geoId === currentTarget.geoId;

  if (!correct) missedTargets.push(currentTarget);

  showFeedback(correct, clickedCountry);
}

function showFeedback(correct, clickedCountry) {
  const overlay = document.getElementById("feedback-overlay");

  const labelEl = document.getElementById("feedback-label");

  if (correct) {
    score++;
    overlay.className = "correct";
    spawnConfetti(window.innerWidth / 2, window.innerHeight / 2);
    labelEl.textContent = "✅ " + formatTargetLabel(currentTarget);
  } else {
    overlay.className = "incorrect";
    const shakeTarget =
      currentBoard === "globe"
        ? document.getElementById("scene-container")
        : document.getElementById("map-container");
    shakeTarget.classList.add("shake");
    setTimeout(() => shakeTarget.classList.remove("shake"), 400);

    let text = t("correct_answer_was") + formatTargetLabel(currentTarget);
    if (clickedCountry) {
      text += "\n" + t("you_clicked") + formatClickedLabel(clickedCountry);
    }
    labelEl.textContent = text;
  }
  labelEl.classList.add("show");

  // Always reveal the correct answer in green; on a miss, also show the
  // player's wrong answer in red.
  const correctAnswer =
    currentMode === "continent" ? currentTarget : currentTarget.geoId;
  const wrongAnswer =
    !correct && clickedCountry
      ? currentMode === "continent"
        ? typeof clickedCountry === "string"
          ? clickedCountry
          : clickedCountry.continent
        : clickedCountry.geoId
      : null;

  if (currentBoard === "globe") {
    buildGlobeTexture(correctAnswer, wrongAnswer);
    if (!correct) {
      const recenterCentroid = getCentroidForTarget(currentTarget);
      if (recenterCentroid) startRecenterAnimation(recenterCentroid);
    }
  } else {
    drawMapOverlay(correctAnswer, wrongAnswer);
  }

  const feedbackDuration = correct ? 1200 : 2800;
  setTimeout(() => {
    overlay.className = "";
    recenterAnim = null;
    nextRound();
  }, feedbackDuration);
}

// ── Confetti (2D overlay) ───────────────────────────────────
function spawnConfetti(cx, cy) {
  const colors = ["#5dd39e", "#ffe066", "#ff9933", "#f06292", "#64b5f6"];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
}

function updateAndDrawParticles() {
  const ctx = particlesCtx;
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  particles = particles.filter((p) => p.life > 0);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life -= p.decay;
    p.rotation += p.rotSpeed;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

// ── Render Loop ─────────────────────────────────────────────
function renderLoop() {
  updateTimer();

  if (currentBoard === "globe") {
    applyInertia();
    correctNorthUp();

    // Recenter animation (on wrong answer: interpolate lon/lat/roll)
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

  updateAndDrawParticles();

  requestAnimationFrame(renderLoop);
}
