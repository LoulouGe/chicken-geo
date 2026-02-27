// ── Country data (ISO id → French name) ────────────────────
const COUNTRY_LIST = [
  { id: "France", nameFr: "France" },
  { id: "Brazil", nameFr: "Br\u00e9sil" },
  { id: "Japan", nameFr: "Japon" },
  { id: "Australia", nameFr: "Australie" },
  { id: "Canada", nameFr: "Canada" },
  { id: "China", nameFr: "Chine" },
  { id: "India", nameFr: "Inde" },
  { id: "Russia", nameFr: "Russie" },
  { id: "United States of America", nameFr: "\u00c9tats-Unis" },
  { id: "Mexico", nameFr: "Mexique" },
  { id: "Argentina", nameFr: "Argentine" },
  { id: "Egypt", nameFr: "\u00c9gypte" },
  { id: "South Africa", nameFr: "Afrique du Sud" },
  { id: "Germany", nameFr: "Allemagne" },
  { id: "Italy", nameFr: "Italie" },
  { id: "Spain", nameFr: "Espagne" },
  { id: "United Kingdom", nameFr: "Royaume-Uni" },
  { id: "Turkey", nameFr: "Turquie" },
  { id: "Saudi Arabia", nameFr: "Arabie saoudite" },
  { id: "Iran", nameFr: "Iran" },
  { id: "Thailand", nameFr: "Tha\u00eflande" },
  { id: "Indonesia", nameFr: "Indon\u00e9sie" },
  { id: "Colombia", nameFr: "Colombie" },
  { id: "Peru", nameFr: "P\u00e9rou" },
  { id: "Nigeria", nameFr: "Nig\u00e9ria" },
  { id: "Kenya", nameFr: "Kenya" },
  { id: "Morocco", nameFr: "Maroc" },
  { id: "Algeria", nameFr: "Alg\u00e9rie" },
  { id: "Norway", nameFr: "Norv\u00e8ge" },
  { id: "Sweden", nameFr: "Su\u00e8de" },
  { id: "Poland", nameFr: "Pologne" },
  { id: "Ukraine", nameFr: "Ukraine" },
  { id: "Greece", nameFr: "Gr\u00e8ce" },
  { id: "Portugal", nameFr: "Portugal" },
  { id: "Chile", nameFr: "Chili" },
  { id: "Venezuela", nameFr: "Venezuela" },
  { id: "Pakistan", nameFr: "Pakistan" },
  { id: "Afghanistan", nameFr: "Afghanistan" },
  { id: "Iraq", nameFr: "Irak" },
  { id: "Madagascar", nameFr: "Madagascar" },
  { id: "Mongolia", nameFr: "Mongolie" },
  { id: "Finland", nameFr: "Finlande" },
  { id: "Vietnam", nameFr: "Vi\u00eat Nam" },
  { id: "South Korea", nameFr: "Cor\u00e9e du Sud" },
  { id: "New Zealand", nameFr: "Nouvelle-Z\u00e9lande" },
  { id: "Cuba", nameFr: "Cuba" },
  { id: "Iceland", nameFr: "Islande" },
  { id: "Libya", nameFr: "Libye" },
  { id: "Sudan", nameFr: "Soudan" },
  { id: "Dem. Rep. Congo", nameFr: "R\u00e9p. d\u00e9m. du Congo" },
];

// ── Constants ───────────────────────────────────────────────
const MAX_ROUNDS = 10;
const ROUND_TIME = 12; // seconds

// ── State ───────────────────────────────────────────────────
let geoData = null;
let countryFeatures = []; // GeoJSON features matching COUNTRY_LIST
let score = 0;
let round = 0;
let currentTarget = null; // { id, nameFr, feature }
let centerLon = 0;
let centerLat = 20;
let timerStart = 0;
let timerRaf = null;
let roundActive = false;

// Chicken animation
let chickenY = 0; // 0 = top, 1 = landed

// Drag state
let dragging = false;
let dragPrev = { x: 0, y: 0 };
let velocity = { lon: 0, lat: 0 };

// Canvas refs
let globeCanvas, globeCtx;
let particlesCanvas, particlesCtx;

// Globe sizing
let globeCx, globeCy, globeR;

// Country pastel colors (stable per feature index)
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

// Particles
let particles = [];

// ── Boot ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  globeCanvas = document.getElementById("globe");
  globeCtx = globeCanvas.getContext("2d");
  particlesCanvas = document.getElementById("particles-canvas");
  particlesCtx = particlesCanvas.getContext("2d");

  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  setupInput();

  document.getElementById("btn-play").addEventListener("click", startGame);
  document.getElementById("btn-replay").addEventListener("click", startGame);

  // Fetch GeoJSON
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
    );
    geoData = await res.json();
    indexCountries();
  } catch (e) {
    console.error("Failed to load GeoJSON:", e);
  }

  // Start render loop
  requestAnimationFrame(renderLoop);
}

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  globeCanvas.width = w * dpr;
  globeCanvas.height = h * dpr;
  globeCanvas.style.width = w + "px";
  globeCanvas.style.height = h + "px";
  globeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  particlesCanvas.width = w * dpr;
  particlesCanvas.height = h * dpr;
  particlesCanvas.style.width = w + "px";
  particlesCanvas.style.height = h + "px";
  particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Globe fills ~70% of the smaller dimension, positioned center-low
  const dim = Math.min(w, h);
  globeR = dim * 0.35;
  globeCx = w / 2;
  globeCy = h * 0.55;
}

// ── Index countries ─────────────────────────────────────────
function indexCountries() {
  if (!geoData) return;
  const nameMap = new Map(COUNTRY_LIST.map((c) => [c.id, c]));
  countryFeatures = [];
  for (const feature of geoData.features) {
    const entry = nameMap.get(feature.properties.name);
    if (entry) {
      countryFeatures.push({ ...entry, feature });
    }
  }
}

// ── Screens ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
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

  // Pick a random country (avoid repeats if possible)
  currentTarget =
    countryFeatures[Math.floor(Math.random() * countryFeatures.length)];

  document.getElementById("country-name").textContent = currentTarget.nameFr;
  document.getElementById("score-display").textContent =
    score + " / " + MAX_ROUNDS;

  // Reset timer
  timerStart = performance.now();
  const bar = document.getElementById("timer-bar");
  bar.style.width = "100%";
  bar.classList.remove("warning");

  // Globe enter animation
  globeCanvas.classList.remove("globe-enter");
  void globeCanvas.offsetWidth; // reflow
  globeCanvas.classList.add("globe-enter");
}

function endGame() {
  roundActive = false;
  cancelAnimationFrame(timerRaf);
  showScreen("end-screen");

  let msg;
  if (score >= 8) msg = "Incroyable ! ";
  else if (score >= 5) msg = "Bien jou\u00e9 ! ";
  else msg = "Continue de t\u2019entra\u00eener ! ";

  document.getElementById("final-score").textContent =
    msg + score + " / " + MAX_ROUNDS;
}

// ── Projection (orthographic) ───────────────────────────────
const DEG = Math.PI / 180;

function project(lon, lat) {
  const lam = lon * DEG;
  const phi = lat * DEG;
  const lam0 = centerLon * DEG;
  const phi0 = centerLat * DEG;

  const cosC =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lam - lam0);
  if (cosC < 0) return null; // back face

  const x = Math.cos(phi) * Math.sin(lam - lam0);
  const y =
    Math.cos(phi0) * Math.sin(phi) -
    Math.sin(phi0) * Math.cos(phi) * Math.cos(lam - lam0);

  return {
    px: globeCx + x * globeR,
    py: globeCy - y * globeR,
  };
}

// ── Point-in-polygon ────────────────────────────────────────
function pointInPoly(poly, lon, lat) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCountryAtCenter() {
  if (!geoData) return null;
  for (const cf of countryFeatures) {
    const geom = cf.feature.geometry;
    if (geom.type === "Polygon") {
      if (pointInPoly(geom.coordinates[0], centerLon, centerLat)) return cf;
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        if (pointInPoly(poly[0], centerLon, centerLat)) return cf;
      }
    }
  }
  return null;
}

// ── Drawing ─────────────────────────────────────────────────
function drawGlobe() {
  const ctx = globeCtx;
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  // Zoom effect — globe grows as chicken dives
  const baseGlobeR = globeR;
  if (roundActive && chickenY > 0) {
    // Ease-in curve for accelerating zoom
    const t = chickenY;
    const zoom = 1 + t * t * 0.55;
    globeR = baseGlobeR * zoom;
  }

  // Ocean
  const oceanGrad = ctx.createRadialGradient(
    globeCx - globeR * 0.3,
    globeCy - globeR * 0.3,
    globeR * 0.1,
    globeCx,
    globeCy,
    globeR,
  );
  oceanGrad.addColorStop(0, "#2d8bc9");
  oceanGrad.addColorStop(0.7, "#1a6daa");
  oceanGrad.addColorStop(1, "#0e4a75");

  ctx.beginPath();
  ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
  ctx.fillStyle = oceanGrad;
  ctx.fill();

  // Draw latitude/longitude grid
  drawGrid(ctx);

  // Draw countries
  if (geoData) {
    const hoveredCountry = getCountryAtCenter();
    let featureIdx = 0;
    for (const feature of geoData.features) {
      const isTarget =
        currentTarget && feature.properties.name === currentTarget.id;
      const isHovered =
        hoveredCountry && feature.properties.name === hoveredCountry.id;
      drawFeature(ctx, feature, featureIdx, isTarget, isHovered);
      featureIdx++;
    }
  }

  // 3D shading overlay
  const shadeGrad = ctx.createRadialGradient(
    globeCx - globeR * 0.25,
    globeCy - globeR * 0.25,
    globeR * 0.05,
    globeCx,
    globeCy,
    globeR,
  );
  shadeGrad.addColorStop(0, "rgba(255,255,255,0.08)");
  shadeGrad.addColorStop(0.5, "rgba(255,255,255,0)");
  shadeGrad.addColorStop(0.8, "rgba(0,0,0,0.15)");
  shadeGrad.addColorStop(1, "rgba(0,0,0,0.4)");

  ctx.beginPath();
  ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
  ctx.fillStyle = shadeGrad;
  ctx.fill();

  // Globe border
  ctx.beginPath();
  ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Speed lines (between globe and chicken for depth)
  if (roundActive && chickenY > 0.05) {
    drawSpeedLines(ctx);
  }

  // Crosshair at center
  if (roundActive) {
    drawCrosshair(ctx);
    drawChicken(ctx);
  }

  // Restore base radius for next frame's sizeCanvas value
  globeR = baseGlobeR;
}

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 0.5;

  // Latitude lines every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = project(lon, lat);
      if (p) {
        if (!started) {
          ctx.moveTo(p.px, p.py);
          started = true;
        } else {
          ctx.lineTo(p.px, p.py);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
  }

  // Longitude lines every 30 degrees
  for (let lon = -180; lon < 180; lon += 30) {
    ctx.beginPath();
    let started = false;
    for (let lat = -90; lat <= 90; lat += 3) {
      const p = project(lon, lat);
      if (p) {
        if (!started) {
          ctx.moveTo(p.px, p.py);
          started = true;
        } else {
          ctx.lineTo(p.px, p.py);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
  }
}

function drawFeature(ctx, feature, featureIdx, isTarget, isHovered) {
  const geom = feature.geometry;
  const polys =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.type === "MultiPolygon"
        ? geom.coordinates
        : [];

  const color = PASTEL_COLORS[featureIdx % PASTEL_COLORS.length];

  for (const polygon of polys) {
    const ring = polygon[0];
    ctx.beginPath();
    let started = false;
    let visible = false;

    for (let i = 0; i < ring.length; i++) {
      const p = project(ring[i][0], ring[i][1]);
      if (p) {
        visible = true;
        if (!started) {
          ctx.moveTo(p.px, p.py);
          started = true;
        } else {
          ctx.lineTo(p.px, p.py);
        }
      } else {
        started = false;
      }
    }

    if (!visible) continue;

    ctx.closePath();

    if (isHovered) {
      ctx.fillStyle = "rgba(255,224,102,0.7)";
    } else {
      ctx.fillStyle = color;
    }
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function drawCrosshair(ctx) {
  const size = 14;
  const gap = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;

  // Horizontal
  ctx.beginPath();
  ctx.moveTo(globeCx - size, globeCy);
  ctx.lineTo(globeCx - gap, globeCy);
  ctx.moveTo(globeCx + gap, globeCy);
  ctx.lineTo(globeCx + size, globeCy);
  ctx.stroke();

  // Vertical
  ctx.beginPath();
  ctx.moveTo(globeCx, globeCy - size);
  ctx.lineTo(globeCx, globeCy - gap);
  ctx.moveTo(globeCx, globeCy + gap);
  ctx.lineTo(globeCx, globeCy + size);
  ctx.stroke();

  // Circle
  ctx.beginPath();
  ctx.arc(globeCx, globeCy, size + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Speed Lines ─────────────────────────────────────────────
function drawSpeedLines(ctx) {
  const intensity = Math.pow(chickenY, 1.8);
  const maxLines = 70;
  const numLines = Math.floor(intensity * maxLines);
  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.save();

  for (let i = 0; i < numLines; i++) {
    // Golden-angle distribution for even spread
    const angle = (i * 137.508 * DEG) % (Math.PI * 2);
    const offset = ((i * 73 + 17) % 50) / 50;
    const innerR = globeR + 8 + offset * 25;
    const lineLen = 30 + intensity * 140 + offset * 50;

    const x1 = globeCx + Math.cos(angle) * innerR;
    const y1 = globeCy + Math.sin(angle) * innerR;
    const x2 = globeCx + Math.cos(angle) * (innerR + lineLen);
    const y2 = globeCy + Math.sin(angle) * (innerR + lineLen);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(200,225,255,${intensity * 0.12 + offset * 0.08})`;
    ctx.lineWidth = 1 + offset * 2.5;
    ctx.stroke();
  }

  // Vignette — tunnel vision effect during dive
  if (intensity > 0.15) {
    const va = (intensity - 0.15) * 0.7;
    const vg = ctx.createRadialGradient(
      globeCx,
      globeCy,
      globeR * 0.7,
      globeCx,
      globeCy,
      Math.max(w, h) * 0.75,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(0.6, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(5,10,30,${va})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

// ── Chicken (PowerZ-style, top-down 3D dive) ────────────────
function drawChicken(ctx) {
  // chickenY: 0 = far above, 1 = landed on globe center
  // The chicken stays roughly centered and grows as it approaches
  const cx = globeCx;
  const cy = globeCy - globeR * 0.15; // slightly above globe center
  const scale = 1.3;

  // Wing flap animation
  const flapAngle = Math.sin(performance.now() * 0.012) * 0.25;
  const flapY = Math.sin(performance.now() * 0.008) * 3;

  ctx.save();
  ctx.translate(cx, cy + flapY * (1 - chickenY));
  ctx.scale(scale, scale);
  ctx.rotate(Math.PI);

  // === Shadow on globe ===
  if (chickenY > 0.2) {
    const shadowAlpha = Math.min(0.35, (chickenY - 0.2) * 0.45);
    const shadowScale = 0.4 + chickenY * 0.6;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.ellipse(
      globeCx,
      globeCy + 10,
      28 * shadowScale,
      10 * shadowScale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.fill();
    ctx.restore();
  }

  // === Tail feathers (back / top — drawn first, behind body) ===
  ctx.save();
  ctx.translate(0, -30);
  const featherColors = [
    "#e8c060",
    "#f0d070",
    "#f5dfa0",
    "#f0d070",
    "#e8c060",
  ];
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.28;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * 3, 5);
    ctx.quadraticCurveTo(Math.sin(a) * 14, -14, Math.sin(a) * 10, -24);
    ctx.quadraticCurveTo(Math.sin(a) * 5, -14, Math.sin(a) * 3, 5);
    ctx.fillStyle = featherColors[i + 2];
    ctx.fill();
    ctx.strokeStyle = "#b89030";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();

  // === Left wing (spread out, flapping) ===
  ctx.save();
  ctx.translate(-28, 0);
  ctx.rotate(-0.2 + flapAngle);
  const lwGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
  lwGrad.addColorStop(0, "#fff8e8");
  lwGrad.addColorStop(1, "#dfc080");
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 12, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = lwGrad;
  ctx.fill();
  ctx.strokeStyle = "#b89030";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Feather lines
  ctx.strokeStyle = "rgba(160,120,40,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(-20, 0);
  ctx.moveTo(-8, 0);
  ctx.lineTo(-19, 3);
  ctx.moveTo(-7, 5);
  ctx.lineTo(-18, 7);
  ctx.stroke();
  ctx.restore();

  // === Right wing (spread out, flapping) ===
  ctx.save();
  ctx.translate(28, 0);
  ctx.rotate(0.2 - flapAngle);
  const rwGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
  rwGrad.addColorStop(0, "#fff8e8");
  rwGrad.addColorStop(1, "#dfc080");
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 12, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = rwGrad;
  ctx.fill();
  ctx.strokeStyle = "#b89030";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = "rgba(160,120,40,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(20, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(19, 3);
  ctx.moveTo(7, 5);
  ctx.lineTo(18, 7);
  ctx.stroke();
  ctx.restore();

  // === Body (round from above, 3D shading) ===
  const bodyGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 32);
  bodyGrad.addColorStop(0, "#fffdf5");
  bodyGrad.addColorStop(0.4, "#fff5e0");
  bodyGrad.addColorStop(0.8, "#f0ddb0");
  bodyGrad.addColorStop(1, "#d4b870");
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 34, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "#b89030";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Belly highlight (lighter center oval)
  const bellyGrad = ctx.createRadialGradient(0, 3, 2, 0, 3, 20);
  bellyGrad.addColorStop(0, "rgba(255,255,255,0.5)");
  bellyGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.ellipse(0, 3, 18, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = bellyGrad;
  ctx.fill();

  // === Head (bottom, facing toward earth) ===
  ctx.save();
  ctx.translate(0, 30);

  // Head circle — 3D shaded
  const headGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
  headGrad.addColorStop(0, "#fffdf5");
  headGrad.addColorStop(0.6, "#fff0d0");
  headGrad.addColorStop(1, "#e0c880");
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = "#b89030";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // === Comb (red, on top of head = back from our view) ===
  ctx.beginPath();
  ctx.moveTo(-7, -16);
  ctx.quadraticCurveTo(-5, -26, -1, -18);
  ctx.quadraticCurveTo(0, -28, 1, -18);
  ctx.quadraticCurveTo(5, -26, 7, -16);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // === Eyes (big, expressive, PowerZ style) ===
  // White sclera — left
  ctx.beginPath();
  ctx.ellipse(-7, -2, 7, 8.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#2c2c2c";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Pupil — left
  ctx.beginPath();
  ctx.arc(-6, 1, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();

  // Iris ring — left
  ctx.beginPath();
  ctx.arc(-6, 1, 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#3a2a10";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Highlight — left
  ctx.beginPath();
  ctx.arc(-8, -1.5, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  // Small highlight
  ctx.beginPath();
  ctx.arc(-5, 3, 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();

  // White sclera — right
  ctx.beginPath();
  ctx.ellipse(7, -2, 7, 8.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#2c2c2c";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Pupil — right
  ctx.beginPath();
  ctx.arc(8, 1, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(8, 1, 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#3a2a10";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Highlight — right
  ctx.beginPath();
  ctx.arc(6, -1.5, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9, 3, 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();

  // === Cheeks (rosy circles, cute) ===
  ctx.beginPath();
  ctx.ellipse(-13, 4, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,150,150,0.3)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, 4, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,150,150,0.3)";
  ctx.fill();

  // === Beak (pointing down toward earth) ===
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.quadraticCurveTo(-3, 10, 0, 22);
  ctx.quadraticCurveTo(3, 10, 6, 8);
  ctx.closePath();
  const beakGrad = ctx.createLinearGradient(0, 8, 0, 22);
  beakGrad.addColorStop(0, "#ffaa33");
  beakGrad.addColorStop(1, "#ff7700");
  ctx.fillStyle = beakGrad;
  ctx.fill();
  ctx.strokeStyle = "#cc5500";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Beak mouth line
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.quadraticCurveTo(0, 14, 4, 12);
  ctx.strokeStyle = "#cc5500";
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // === Wattles ===
  ctx.beginPath();
  ctx.ellipse(-2, 13, 3, 5, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2, 13, 3, 5, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "#d63031";
  ctx.fill();

  ctx.restore(); // head

  // === Feet (visible splayed behind during dive) ===
  if (chickenY < 0.8) {
    ctx.save();
    ctx.translate(0, -32);
    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    // Left foot
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-12, -12);
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, -18);
    ctx.moveTo(-12, -12);
    ctx.lineTo(-10, -19);
    ctx.moveTo(-12, -12);
    ctx.lineTo(-8, -17);
    ctx.stroke();
    // Right foot
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(12, -12);
    ctx.moveTo(12, -12);
    ctx.lineTo(16, -18);
    ctx.moveTo(12, -12);
    ctx.lineTo(10, -19);
    ctx.moveTo(12, -12);
    ctx.lineTo(8, -17);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // main transform
}

// ── Input handling ──────────────────────────────────────────
function setupInput() {
  // Mouse
  globeCanvas.addEventListener("mousedown", (e) => {
    dragging = true;
    dragPrev = { x: e.clientX, y: e.clientY };
    velocity = { lon: 0, lat: 0 };
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragPrev.x;
    const dy = e.clientY - dragPrev.y;
    const sensitivity = 0.3;
    centerLon -= dx * sensitivity;
    centerLat += dy * sensitivity;
    centerLat = Math.max(-85, Math.min(85, centerLat));
    velocity = { lon: -dx * sensitivity, lat: dy * sensitivity };
    dragPrev = { x: e.clientX, y: e.clientY };
  });

  // Touch
  globeCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        dragPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        velocity = { lon: 0, lat: 0 };
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "touchend",
    () => {
      dragging = false;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragPrev.x;
      const dy = e.touches[0].clientY - dragPrev.y;
      const sensitivity = 0.3;
      centerLon -= dx * sensitivity;
      centerLat += dy * sensitivity;
      centerLat = Math.max(-85, Math.min(85, centerLat));
      velocity = { lon: -dx * sensitivity, lat: dy * sensitivity };
      dragPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true },
  );
}

// ── Particles / Confetti ────────────────────────────────────
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

function spawnCrackParticles(cx, cy) {
  const colors = ["#2d8bc9", "#1a6daa", "#5dd39e", "#a8d8b9", "#fff"];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: 0.02 + Math.random() * 0.015,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
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
    p.vy += 0.12; // gravity
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

// ── Timer & Round logic ─────────────────────────────────────
function updateTimer() {
  if (!roundActive) return;

  const elapsed = (performance.now() - timerStart) / 1000;
  const remaining = Math.max(0, ROUND_TIME - elapsed);
  const frac = remaining / ROUND_TIME;

  chickenY = 1 - frac; // descends as time runs out

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

  const hoveredCountry = getCountryAtCenter();
  const correct =
    hoveredCountry && hoveredCountry.id === currentTarget.id;

  const overlay = document.getElementById("feedback-overlay");

  if (correct) {
    score++;
    document.getElementById("score-display").textContent =
      score + " / " + MAX_ROUNDS;
    overlay.className = "correct";
    spawnConfetti(globeCx, globeCy);
    spawnCrackParticles(globeCx, globeCy);
  } else {
    overlay.className = "incorrect";
    globeCanvas.classList.add("shake");
    setTimeout(() => globeCanvas.classList.remove("shake"), 400);
  }

  setTimeout(() => {
    overlay.className = "";
    nextRound();
  }, 1200);
}

// ── Inertia ─────────────────────────────────────────────────
function applyInertia() {
  if (dragging) return;
  centerLon += velocity.lon;
  centerLat += velocity.lat;
  centerLat = Math.max(-85, Math.min(85, centerLat));
  velocity.lon *= 0.92;
  velocity.lat *= 0.92;
  if (Math.abs(velocity.lon) < 0.01) velocity.lon = 0;
  if (Math.abs(velocity.lat) < 0.01) velocity.lat = 0;
}

// ── Render Loop ─────────────────────────────────────────────
function renderLoop() {
  applyInertia();
  updateTimer();
  drawGlobe();
  updateAndDrawParticles();
  requestAnimationFrame(renderLoop);
}
