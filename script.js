// ── UI Strings (multilanguage) ───────────────────────────────
const UI_STRINGS = {
  fr: {
    mode_countries: "Pays",
    mode_flags: "Drapeaux",
    mode_capitals: "Capitales",
    subtitle_countries: "Fais atterrir la poule sur le bon pays !",
    subtitle_flags: "Quel pays a ce drapeau ?",
    subtitle_capitals: "Trouve le pays de cette capitale !",
    question: "Question",
    accelerate: "Accélérer !",
    end_title: "Partie terminée !",
    replay: "Rejouer",
    back_menu: "Retour au menu",
    score_amazing: "Incroyable ! ",
    score_good: "Bien joué ! ",
    score_try: "Continue de t\u2019entraîner ! ",
    load_error_btn: "Erreur de chargement",
    load_error_msg:
      "Impossible de charger la carte. Vérifie ta connexion et recharge la page.",
  },
  en: {
    mode_countries: "Countries",
    mode_flags: "Flags",
    mode_capitals: "Capitals",
    subtitle_countries: "Land the chicken on the right country!",
    subtitle_flags: "Which country has this flag?",
    subtitle_capitals: "Find the country of this capital!",
    question: "Question",
    accelerate: "Speed up!",
    end_title: "Game over!",
    replay: "Play again",
    back_menu: "Back to menu",
    score_amazing: "Amazing! ",
    score_good: "Well done! ",
    score_try: "Keep practising! ",
    load_error_btn: "Loading error",
    load_error_msg:
      "Could not load the map. Check your connection and reload the page.",
  },
  es: {
    mode_countries: "Países",
    mode_flags: "Banderas",
    mode_capitals: "Capitales",
    subtitle_countries: "¡Haz aterrizar la gallina en el país correcto!",
    subtitle_flags: "¿Qué país tiene esta bandera?",
    subtitle_capitals: "¡Encuentra el país de esta capital!",
    question: "Pregunta",
    accelerate: "¡Acelerar!",
    end_title: "¡Partida terminada!",
    replay: "Volver a jugar",
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

// ── Constants ───────────────────────────────────────────────
const MAX_ROUNDS = 5;
const ROUND_TIME = 18; // seconds
const DEG = Math.PI / 180;

const CAM_START_Z = 3.5;
const CAM_END_Z = 1.8;

// ── State ───────────────────────────────────────────────────
let currentLang = "fr";
let currentMode = "countries";
let countriesData = []; // loaded from countries.json

let geoData = null;
let countryFeatures = [];
let score = 0;
let round = 0;
let currentTarget = null;
let timerStart = 0;
let roundActive = false;
let chickenY = 0; // 0 = far, 1 = landed
let accelerating = false;
let accelHoldTime = 0; // how long the button has been held (seconds)
let timerAccum = 0; // accumulated virtual time (seconds)
let lastTimerTick = 0; // real timestamp of last timer update
let diveAnim = null; // chicken dive-into-globe animation

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

// Recenter animation state (used on wrong answer)
let recenterAnim = null;

// Three.js objects
let scene, camera, renderer;
let globeMesh, globeTexCanvas, globeTexCtx, globeTexture;
let baseTexCanvas, baseTexCtx;
let chickenGroup;

// 3D speed particles
const SPEED_PARTICLE_COUNT = 120;
let speedPoints, speedPosAttr;
let speedParticleData = [];

// Particles overlay (2D confetti)
let particlesCanvas, particlesCtx;
let particles = [];

// Country pastel colors
const PASTEL_COLORS = [
  "#a8d8b9",
  "#f7c59f",
  "#b5d2f0",
  "#f0b7c4",
  "#d4c5f9",
  "#fbe29a",
  "#a0e7e5",
  "#f9c2d0",
  "#c5e1a5",
  "#ffe0b2",
  "#b3c7e6",
  "#f8bbd0",
  "#c8e6c9",
  "#ffe082",
  "#b2dfdb",
  "#d1c4e9",
];

// Reusable raycaster & screen-center vector
const _raycaster = new THREE.Raycaster();
const _screenCenter = new THREE.Vector2(0, 0);

// ── Boot ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  particlesCanvas = document.getElementById("particles-canvas");
  particlesCtx = particlesCanvas.getContext("2d");
  sizeParticlesCanvas();

  initThree();
  buildChicken();
  initSpeedParticles();

  window.addEventListener("resize", onResize);
  setupInput();
  setupMenuEvents();
  updateUIText();

  // Accelerate button (pointer events work for both mouse and touch)
  const btnAccel = document.getElementById("btn-accelerate");
  btnAccel.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    accelerating = true;
    btnAccel.classList.add("pressing");
  });
  window.addEventListener("pointerup", () => {
    accelerating = false;
    btnAccel.classList.remove("pressing");
  });
  window.addEventListener("pointercancel", () => {
    accelerating = false;
    btnAccel.classList.remove("pressing");
  });

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

  // Mode buttons
  document.querySelectorAll(".btn-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      startGame();
    });
  });

  // Replay button
  document
    .getElementById("btn-replay")
    .addEventListener("click", startGame);

  // Back to menu
  document
    .getElementById("btn-back-menu")
    .addEventListener("click", () => showScreen("start-screen"));
}

function updateUIText() {
  // Mode buttons
  document.getElementById("btn-mode-countries").textContent =
    t("mode_countries");
  document.getElementById("btn-mode-flags").textContent = t("mode_flags");
  document.getElementById("btn-mode-capitals").textContent =
    t("mode_capitals");

  // Accelerate button
  document.getElementById("btn-accelerate").textContent = t("accelerate");

  // End screen
  document.getElementById("end-title").textContent = t("end_title");
  document.getElementById("btn-replay").textContent = t("replay");
  document.getElementById("btn-back-menu").textContent = t("back_menu");
}

// ── Three.js Setup ──────────────────────────────────────────
function initThree() {
  const container = document.getElementById("scene-container");
  const w = window.innerWidth;
  const h = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, CAM_START_Z);

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

// ── Globe Texture (equirectangular) ─────────────────────────

// Render a single feature's polygons onto a context
function drawFeature(ctx, feature, w, h, color, glow) {
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
      const lon = ring[i][0];
      const lat = ring[i][1];
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (glow) {
      ctx.save();
      ctx.shadowColor = "rgba(255,60,60,0.8)";
      ctx.shadowBlur = 30;
      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

// Build the cached base texture (ocean + grid + all countries).
// Called once after GeoJSON loads.
function buildBaseTexture() {
  if (!geoData) return;
  const ctx = baseTexCtx;
  const w = baseTexCanvas.width;
  const h = baseTexCanvas.height;

  // Ocean
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, "#0e4a75");
  oceanGrad.addColorStop(0.5, "#1a6daa");
  oceanGrad.addColorStop(1, "#0e4a75");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

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

  // Draw all countries in default pastel colors
  let featureIdx = 0;
  for (const feature of geoData.features) {
    drawFeature(
      ctx,
      feature,
      w,
      h,
      PASTEL_COLORS[featureIdx % PASTEL_COLORS.length],
      false,
    );
    featureIdx++;
  }
}

// Build the visible globe texture. Blits the cached base then overdraws
// only the 1-2 highlighted / correct-answer features.
function buildGlobeTexture(highlightId, correctAnswerId) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

  // Blit cached base
  ctx.drawImage(baseTexCanvas, 0, 0);

  // Overdraw highlighted / correct features only
  if (highlightId || correctAnswerId) {
    for (const feature of geoData.features) {
      const name = feature.properties.name;
      if (name === correctAnswerId) {
        drawFeature(ctx, feature, w, h, "rgba(220,40,40,0.9)", true);
      } else if (name === highlightId) {
        drawFeature(ctx, feature, w, h, "rgba(93,211,158,0.9)", false);
      }
    }
  }

  globeTexture.needsUpdate = true;
}

// ── Index Countries ─────────────────────────────────────────
function indexCountries() {
  if (!geoData || !countriesData.length) return;
  const geoMap = new Map(countriesData.map((c) => [c.geoId, c]));
  countryFeatures = [];
  for (const feature of geoData.features) {
    const entry = geoMap.get(feature.properties.name);
    if (entry) {
      countryFeatures.push({ ...entry, feature });
    }
  }
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

function getCountryAtCenter() {
  if (!geoData) return null;
  // Raycast from camera center to globe
  _raycaster.setFromCamera(_screenCenter, camera);
  const hits = _raycaster.intersectObject(globeMesh);
  if (hits.length === 0) return null;

  // Use 3D intersection point for precision
  const p = hits[0].point.clone();
  globeMesh.worldToLocal(p);
  p.normalize();

  const phi = Math.atan2(p.z, -p.x);
  let u = phi / (2 * Math.PI);
  if (u < 0) u += 1;
  const lon = u * 360 - 180;
  const lat = Math.asin(p.y) / DEG;

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

function startRecenterAnimation(cf) {
  const centroid = getCountryCentroid(cf);
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
    fromCamZ: camera.position.z,
    toCamZ: 2.2,
  };

  // Stop any inertia
  velocityLon = 0;
  velocityLat = 0;
  velocityRoll = 0;
}

// ── Chicken Sprite (PNG) ─────────────────────────────────────
function buildChicken() {
  const loader = new THREE.TextureLoader();
  loader.load("chicken.png", (tex) => {
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    chickenGroup = new THREE.Sprite(mat);
    chickenGroup.scale.set(0.7, 0.55, 1);
    scene.add(chickenGroup);
  });
}

// ── 3D Speed Particles ──────────────────────────────────────
function initSpeedParticles() {
  const positions = new Float32Array(SPEED_PARTICLE_COUNT * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xcceeff,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  speedPoints = new THREE.Points(geo, mat);
  scene.add(speedPoints);
  speedPosAttr = geo.attributes.position;

  for (let i = 0; i < SPEED_PARTICLE_COUNT; i++) {
    speedParticleData.push({
      life: 0,
      vy: 0,
      vz: 0,
      vx: 0,
    });
    // Position offscreen
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -100;
    positions[i * 3 + 2] = 0;
  }
}

function updateSpeedParticles() {
  if (!chickenGroup || !roundActive) {
    if (speedPoints) speedPoints.visible = false;
    return;
  }
  speedPoints.visible = true;

  const intensity = chickenY * chickenY;
  const spawnChance = intensity * 0.4; // per particle per frame
  const cPos = chickenGroup.position;
  const arr = speedPosAttr.array;

  for (let i = 0; i < SPEED_PARTICLE_COUNT; i++) {
    const d = speedParticleData[i];

    if (d.life <= 0) {
      // Maybe respawn
      if (Math.random() < spawnChance) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.08 + Math.random() * 0.2;
        arr[i * 3] = cPos.x + Math.cos(angle) * radius;
        arr[i * 3 + 1] = cPos.y + (Math.random() - 0.3) * 0.15;
        arr[i * 3 + 2] = cPos.z + Math.sin(angle) * radius * 0.4;

        d.vx = (Math.random() - 0.5) * 0.003;
        d.vy = 0.025 + Math.random() * 0.04; // upward (opposite to dive)
        d.vz = 0.008 + Math.random() * 0.015; // toward camera
        d.life = 0.4 + Math.random() * 0.6;
      }
    } else {
      arr[i * 3] += d.vx;
      arr[i * 3 + 1] += d.vy;
      arr[i * 3 + 2] += d.vz;
      d.life -= 0.025;

      // Fade out: move offscreen when dead
      if (d.life <= 0) {
        arr[i * 3 + 1] = -100;
      }
    }
  }

  speedPosAttr.needsUpdate = true;
  // Adjust opacity based on intensity
  speedPoints.material.opacity = Math.min(0.7, intensity * 1.2);
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
  showScreen("game-screen");
  nextRound();
}

function nextRound() {
  if (round >= MAX_ROUNDS) {
    endGame();
    return;
  }

  round++;
  roundActive = true;
  chickenY = 0;
  accelerating = false;
  accelHoldTime = 0;
  timerAccum = 0;
  lastTimerTick = performance.now();

  // Show accelerate button
  document.getElementById("btn-accelerate").classList.add("visible");

  // Reset globe orientation and camera
  globeLon = 0;
  globeLat = 0.35;
  globeRoll = 0;
  velocityLon = 0;
  velocityLat = 0;
  velocityRoll = 0;
  camera.position.set(0, 0, CAM_START_Z);

  // Pick random country
  currentTarget =
    countryFeatures[Math.floor(Math.random() * countryFeatures.length)];

  // Display question based on mode
  const nameEl = document.getElementById("country-name");
  const subtitleEl = document.getElementById("game-subtitle");

  if (currentMode === "flags") {
    nameEl.innerHTML = '<span class="flag-emoji">' + currentTarget.flag + "</span>";
    subtitleEl.textContent = t("subtitle_flags");
  } else if (currentMode === "capitals") {
    nameEl.textContent = currentTarget[currentLang].capital;
    subtitleEl.textContent = t("subtitle_capitals");
  } else {
    nameEl.textContent = currentTarget[currentLang].name;
    subtitleEl.textContent = t("subtitle_countries");
  }

  document.getElementById("score-display").textContent =
    t("question") + " " + round + " / " + MAX_ROUNDS;

  // Reset timer
  timerStart = performance.now();
  const bar = document.getElementById("timer-bar");
  bar.style.width = "100%";
  bar.classList.remove("warning");

  // Reset highlight
  lastHighlightId = null;

  // Reset globe texture (no highlight)
  buildGlobeTexture();
}

let lastHighlightId = null;

function endGame() {
  roundActive = false;
  accelerating = false;
  document
    .getElementById("btn-accelerate")
    .classList.remove("visible", "pressing");
  showScreen("end-screen");

  document.getElementById("end-title").textContent = t("end_title");
  document.getElementById("btn-replay").textContent = t("replay");
  document.getElementById("btn-back-menu").textContent = t("back_menu");

  let msg;
  if (score >= 4) msg = t("score_amazing");
  else if (score >= 3) msg = t("score_good");
  else msg = t("score_try");

  document.getElementById("final-score").textContent =
    msg + score + " / " + MAX_ROUNDS;
}

// ── Input Handling ──────────────────────────────────────────
function setupInput() {
  const container = document.getElementById("scene-container");

  let lastMoveTime = 0; // timestamp of last drag move event

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

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    dragPrev = { x: e.clientX, y: e.clientY };
    velocityLon = 0;
    velocityLat = 0;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    killInertiaIfPaused();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging || recenterAnim) return;
    const dx = e.clientX - dragPrev.x;
    const dy = e.clientY - dragPrev.y;
    applyDragDelta(dx, dy);
    dragPrev = { x: e.clientX, y: e.clientY };
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
    const t = (absLatAngle - POLE_START) / (POLE_END - POLE_START);
    strength = 1.0 - t * t * (3 - 2 * t); // smoothstep
  }

  globeRoll *= 1 - strength * 0.12;
}

// ── Timer & Round ───────────────────────────────────────────
function updateTimer() {
  if (!roundActive) return;

  const now = performance.now();
  const realDelta = (now - lastTimerTick) / 1000;
  lastTimerTick = now;

  // Progressive acceleration: starts at 2x, ramps up to 8x over ~3 seconds
  if (accelerating) {
    accelHoldTime += realDelta;
    const ramp = Math.min(accelHoldTime / 3, 1); // 0→1 over 3 seconds
    const speed = 2 + ramp * 6; // 2x → 8x
    timerAccum += realDelta * speed;
  } else {
    accelHoldTime = 0;
    timerAccum += realDelta;
  }

  const remaining = Math.max(0, ROUND_TIME - timerAccum);
  const frac = remaining / ROUND_TIME;

  // Ease-in quadratic: t² — earth approaches progressively
  const tt = 1 - frac;
  chickenY = tt * tt;

  const bar = document.getElementById("timer-bar");
  bar.style.width = frac * 100 + "%";

  if (frac < 0.4) {
    bar.classList.add("warning");
  } else {
    bar.classList.remove("warning");
  }

  if (remaining <= 0) {
    resolveRound();
  }
}

function resolveRound() {
  roundActive = false;
  accelerating = false;
  document
    .getElementById("btn-accelerate")
    .classList.remove("visible", "pressing");

  const hoveredCountry = getCountryAtCenter();
  const correct =
    hoveredCountry && hoveredCountry.geoId === currentTarget.geoId;

  // Start chicken dive-into-globe animation
  diveAnim = {
    startTime: performance.now(),
    duration: 500,
    startZ: chickenGroup ? chickenGroup.position.z : camera.position.z - 1.2,
    startY: chickenGroup ? chickenGroup.position.y : -0.1,
    startScaleW: chickenGroup ? chickenGroup.scale.x : 0.32,
    startScaleH: chickenGroup ? chickenGroup.scale.y : 0.25,
  };

  // Show feedback after dive completes
  setTimeout(() => showFeedback(correct), 520);
}

function showFeedback(correct) {
  const overlay = document.getElementById("feedback-overlay");
  const fbChicken = document.getElementById("feedback-chicken");

  if (correct) {
    score++;
    overlay.className = "correct";
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    spawnConfetti(cx, cy);
    fbChicken.src = "chicken-happy.png";
    // Center bottom
    fbChicken.style.left = "50%";
    fbChicken.style.top = "auto";
    fbChicken.style.bottom = "5%";
    fbChicken.style.transform = "translateX(-50%) scale(0)";
  } else {
    overlay.className = "incorrect";
    const container = document.getElementById("scene-container");
    container.classList.add("shake");
    setTimeout(() => container.classList.remove("shake"), 400);
    buildGlobeTexture(null, currentTarget.geoId);

    // Recenter globe on correct country + zoom in
    startRecenterAnimation(currentTarget);

    // Pointing chicken next to the correct country
    const imgH = Math.min(window.innerWidth * 0.4, 220) * 0.8;
    fbChicken.src = "chicken-point.png";
    fbChicken.style.left = window.innerWidth / 2 + 60 + "px";
    fbChicken.style.top = window.innerHeight / 2 - imgH / 2 + "px";
    fbChicken.style.bottom = "auto";
    fbChicken.style.transform = "scale(0)";
  }

  // Show feedback chicken with bounce-in
  fbChicken.classList.add("show");

  const feedbackDuration = correct ? 2000 : 4000;
  setTimeout(() => {
    overlay.className = "";
    fbChicken.classList.remove("show");
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

  // Draw crosshair on 2D overlay when round is active
  if (roundActive) {
    drawCrosshair(ctx, w / 2, h / 2);
    // 2D speed lines around chicken
    if (chickenY > 0.03) {
      drawSpeedLines(ctx, w / 2, h / 2);
    }
  }

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

function drawSpeedLines(ctx, cx, cy) {
  const intensity = Math.pow(chickenY, 1.8);
  const maxLines = 60;
  const numLines = Math.floor(intensity * maxLines);

  ctx.save();
  const chickenScreenY = cy + 30;

  for (let i = 0; i < numLines; i++) {
    const angle = (i * 137.508 * DEG) % (Math.PI * 2);
    const offset = ((i * 73 + 17) % 50) / 50;
    const innerR = 40 + offset * 20;
    const lineLen = 20 + intensity * 100 + offset * 40;

    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = chickenScreenY + Math.sin(angle) * innerR * 0.6;
    const x2 = cx + Math.cos(angle) * (innerR + lineLen);
    const y2 = chickenScreenY + Math.sin(angle) * (innerR + lineLen) * 0.6;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(200,230,255,${intensity * 0.15 + offset * 0.1})`;
    ctx.lineWidth = 1 + offset * 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrosshair(ctx, cx, cy) {
  const size = 10;
  const gap = 3;
  ctx.strokeStyle = "rgba(220,40,40,0.9)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Horizontal
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + size, cy);
  ctx.stroke();

  // Vertical
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();
}

// ── Render Loop ─────────────────────────────────────────────
function renderLoop() {
  applyInertia();
  correctNorthUp();
  updateTimer();

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
    camera.position.z =
      recenterAnim.fromCamZ +
      (recenterAnim.toCamZ - recenterAnim.fromCamZ) * e;

    if (rt >= 1) {
      recenterAnim = null;
    }
  }

  // Build quaternion from lon/lat/roll and apply to globe mesh
  updateGlobeQuat();
  globeMesh.quaternion.copy(globeQuat);

  // Camera dive animation
  if (roundActive) {
    const z = CAM_START_Z - (CAM_START_Z - CAM_END_Z) * chickenY;
    camera.position.z = z;
  }

  // Position chicken sprite between camera and globe
  if (chickenGroup) {
    chickenGroup.visible = roundActive || diveAnim !== null;

    if (roundActive) {
      const chickenZ = camera.position.z - 1.2;
      chickenGroup.position.set(0, -0.1, chickenZ);
      chickenGroup.renderOrder = 999;

      // Slight bobbing
      const bob =
        Math.sin(performance.now() * 0.005) * 0.02 * (1 - chickenY);
      chickenGroup.position.y += bob;

      // Scale: shrinks slightly during dive
      const baseW = 0.32;
      const baseH = 0.25;
      const s = 1.0 - chickenY * 0.15;
      chickenGroup.scale.set(baseW * s, baseH * s, 1);

      // Slight vibration at high speed
      if (chickenY > 0.5) {
        const shake = (chickenY - 0.5) * 0.01;
        chickenGroup.position.x += (Math.random() - 0.5) * shake;
        chickenGroup.position.y += (Math.random() - 0.5) * shake;
      }
    } else if (diveAnim) {
      // Chicken shrinks and rises toward crosshair, simulating a dive
      const elapsed = performance.now() - diveAnim.startTime;
      const dt = Math.min(1, elapsed / diveAnim.duration);
      const e = dt * dt; // ease-in (accelerating)

      // Stay at same z (depthTest off ensures visibility), move toward crosshair
      chickenGroup.position.z = diveAnim.startZ;
      chickenGroup.position.x = 0;
      const targetY = -0.02;
      chickenGroup.position.y =
        diveAnim.startY + (targetY - diveAnim.startY) * e;
      chickenGroup.renderOrder = 999;

      // Shrink uniformly to tiny
      const shrink = 1 - e * 0.95;
      chickenGroup.scale.set(
        diveAnim.startScaleW * shrink,
        diveAnim.startScaleH * shrink,
        1,
      );

      if (dt >= 1) {
        diveAnim = null;
      }
    }
  }

  // Update 3D speed particles
  updateSpeedParticles();

  // Highlight country at center
  if (roundActive && geoData) {
    const hovered = getCountryAtCenter();
    const hoveredId = hovered ? hovered.geoId : null;
    if (hoveredId !== lastHighlightId) {
      lastHighlightId = hoveredId;
      buildGlobeTexture(hoveredId);
    }
  }

  renderer.render(scene, camera);
  updateAndDrawParticles();

  requestAnimationFrame(renderLoop);
}
