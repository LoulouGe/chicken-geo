// ── Country data (ISO id → French name) ────────────────────
const COUNTRY_LIST = [
  { id: "France", nameFr: "France" },
  { id: "Brazil", nameFr: "Brésil" },
  { id: "Japan", nameFr: "Japon" },
  { id: "Australia", nameFr: "Australie" },
  { id: "Canada", nameFr: "Canada" },
  { id: "China", nameFr: "Chine" },
  { id: "India", nameFr: "Inde" },
  { id: "Russia", nameFr: "Russie" },
  { id: "United States of America", nameFr: "États-Unis" },
  { id: "Mexico", nameFr: "Mexique" },
  { id: "Argentina", nameFr: "Argentine" },
  { id: "Egypt", nameFr: "Égypte" },
  { id: "South Africa", nameFr: "Afrique du Sud" },
  { id: "Germany", nameFr: "Allemagne" },
  { id: "Italy", nameFr: "Italie" },
  { id: "Spain", nameFr: "Espagne" },
  { id: "United Kingdom", nameFr: "Royaume-Uni" },
  { id: "Turkey", nameFr: "Turquie" },
  { id: "Saudi Arabia", nameFr: "Arabie saoudite" },
  { id: "Iran", nameFr: "Iran" },
  { id: "Thailand", nameFr: "Thaïlande" },
  { id: "Indonesia", nameFr: "Indonésie" },
  { id: "Colombia", nameFr: "Colombie" },
  { id: "Peru", nameFr: "Pérou" },
  { id: "Nigeria", nameFr: "Nigéria" },
  { id: "Kenya", nameFr: "Kenya" },
  { id: "Morocco", nameFr: "Maroc" },
  { id: "Algeria", nameFr: "Algérie" },
  { id: "Norway", nameFr: "Norvège" },
  { id: "Sweden", nameFr: "Suède" },
  { id: "Poland", nameFr: "Pologne" },
  { id: "Ukraine", nameFr: "Ukraine" },
  { id: "Greece", nameFr: "Grèce" },
  { id: "Portugal", nameFr: "Portugal" },
  { id: "Chile", nameFr: "Chili" },
  { id: "Venezuela", nameFr: "Venezuela" },
  { id: "Pakistan", nameFr: "Pakistan" },
  { id: "Afghanistan", nameFr: "Afghanistan" },
  { id: "Iraq", nameFr: "Irak" },
  { id: "Madagascar", nameFr: "Madagascar" },
  { id: "Mongolia", nameFr: "Mongolie" },
  { id: "Finland", nameFr: "Finlande" },
  { id: "Vietnam", nameFr: "Viêt Nam" },
  { id: "South Korea", nameFr: "Corée du Sud" },
  { id: "New Zealand", nameFr: "Nouvelle-Zélande" },
  { id: "Cuba", nameFr: "Cuba" },
  { id: "Iceland", nameFr: "Islande" },
  { id: "Libya", nameFr: "Libye" },
  { id: "Sudan", nameFr: "Soudan" },
  { id: "Dem. Rep. Congo", nameFr: "Rép. dém. du Congo" },
];

// ── Constants ───────────────────────────────────────────────
const MAX_ROUNDS = 5;
const ROUND_TIME = 12; // seconds
const DEG = Math.PI / 180;

const CAM_START_Z = 4.5;
const CAM_END_Z = 2.0;

// ── State ───────────────────────────────────────────────────
let geoData = null;
let countryFeatures = [];
let score = 0;
let round = 0;
let currentTarget = null;
let timerStart = 0;
let roundActive = false;
let chickenY = 0; // 0 = far, 1 = landed

// Drag / rotation state
let dragging = false;
let dragPrev = { x: 0, y: 0 };
let velocity = { lon: 0, lat: 0 };
let globeRotY = 0; // longitude rotation (radians)
let globeRotX = 0.35; // latitude rotation (radians) — slight tilt

// Recenter animation state (used on wrong answer)
let recenterAnim = null;

// Three.js objects
let scene, camera, renderer;
let globeMesh, globeTexCanvas, globeTexCtx, globeTexture;
let chickenGroup;

// Particles overlay (2D confetti)
let particlesCanvas, particlesCtx;
let particles = [];

// Country pastel colors
const PASTEL_COLORS = [
  "#a8d8b9", "#f7c59f", "#b5d2f0", "#f0b7c4", "#d4c5f9",
  "#fbe29a", "#a0e7e5", "#f9c2d0", "#c5e1a5", "#ffe0b2",
  "#b3c7e6", "#f8bbd0", "#c8e6c9", "#ffe082", "#b2dfdb", "#d1c4e9",
];

// ── Boot ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  particlesCanvas = document.getElementById("particles-canvas");
  particlesCtx = particlesCanvas.getContext("2d");
  sizeParticlesCanvas();

  initThree();
  buildChicken();

  window.addEventListener("resize", onResize);
  setupInput();

  document.getElementById("btn-play").addEventListener("click", startGame);
  document.getElementById("btn-replay").addEventListener("click", startGame);

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
    );
    geoData = await res.json();
    indexCountries();
    buildGlobeTexture();
  } catch (e) {
    console.error("Failed to load GeoJSON:", e);
  }

  requestAnimationFrame(renderLoop);
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
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 3, 8);
  scene.add(dirLight);

  // Globe geometry
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

  // Offscreen canvas for equirectangular texture
  globeTexCanvas = document.createElement("canvas");
  globeTexCanvas.width = 4096;
  globeTexCanvas.height = 2048;
  globeTexCtx = globeTexCanvas.getContext("2d");

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
function buildGlobeTexture(highlightId, correctAnswerId) {
  if (!geoData) return;
  const ctx = globeTexCtx;
  const w = globeTexCanvas.width;
  const h = globeTexCanvas.height;

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

  // Draw countries
  let featureIdx = 0;
  for (const feature of geoData.features) {
    const geom = feature.geometry;
    const polys =
      geom.type === "Polygon"
        ? [geom.coordinates]
        : geom.type === "MultiPolygon"
          ? geom.coordinates
          : [];

    const isHighlight = highlightId && feature.properties.name === highlightId;
    const isCorrectAnswer = correctAnswerId && feature.properties.name === correctAnswerId;
    const color = isCorrectAnswer
      ? "rgba(220,40,40,0.9)"
      : isHighlight
        ? "rgba(93,211,158,0.9)"
        : PASTEL_COLORS[featureIdx % PASTEL_COLORS.length];

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
      // Red glow around correct answer
      if (isCorrectAnswer) {
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
    featureIdx++;
  }

  globeTexture.needsUpdate = true;
}

// ── Index Countries ─────────────────────────────────────────
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

// ── Point-in-polygon ────────────────────────────────────────
function pointInPoly(poly, lon, lat) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
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
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObject(globeMesh);
  if (hits.length === 0) return null;

  // Use 3D intersection point for precision (UV interpolation is unreliable near seams/poles)
  const p = hits[0].point.clone();
  globeMesh.worldToLocal(p);
  p.normalize();

  // SphereGeometry: x = -cos(phi)*sin(theta), y = cos(theta), z = sin(phi)*sin(theta)
  // phi = azimuthal angle, maps to texture u = phi/(2PI) → lon = u*360-180
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

// ── Project country centroid to screen position ─────────────
function getCountryScreenPos(cf) {
  if (!cf || !cf.feature) return null;
  const geom = cf.feature.geometry;
  const coords =
    geom.type === "Polygon"
      ? geom.coordinates[0]
      : geom.type === "MultiPolygon"
        ? geom.coordinates[0][0]
        : null;
  if (!coords) return null;

  // Compute centroid
  let sumLon = 0, sumLat = 0;
  for (const c of coords) {
    sumLon += c[0];
    sumLat += c[1];
  }
  const cLon = sumLon / coords.length;
  const cLat = sumLat / coords.length;

  // Convert lon/lat to 3D point on sphere (matching SphereGeometry mapping)
  const u = (cLon + 180) / 360;
  const v = (90 - cLat) / 180;
  const theta = v * Math.PI;
  const phi2 = u * 2 * Math.PI;
  const point3d = new THREE.Vector3(
    -Math.cos(phi2) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi2) * Math.sin(theta),
  );

  // Transform to world space
  point3d.applyMatrix4(globeMesh.matrixWorld);

  // Project to screen
  point3d.project(camera);
  const sx = (point3d.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-point3d.y * 0.5 + 0.5) * window.innerHeight;

  return { x: sx, y: sy };
}

// ── Country centroid + recenter animation ────────────────────
function getCountryCentroid(cf) {
  const geom = cf.feature.geometry;
  const coords =
    geom.type === "Polygon"
      ? geom.coordinates[0]
      : geom.type === "MultiPolygon"
        ? geom.coordinates[0][0]
        : null;
  if (!coords) return null;
  let sumLon = 0, sumLat = 0;
  for (const c of coords) {
    sumLon += c[0];
    sumLat += c[1];
  }
  return { lon: sumLon / coords.length, lat: sumLat / coords.length };
}

function getCenterLonLat() {
  // Compute what lon/lat the camera currently sees at center
  const p = new THREE.Vector3(0, 0, 1);
  const invMatrix = new THREE.Matrix4()
    .makeRotationFromEuler(new THREE.Euler(globeRotX, globeRotY, 0, "XYZ"))
    .invert();
  p.applyMatrix4(invMatrix);
  const ph = Math.atan2(p.z, -p.x);
  let uu = ph / (2 * Math.PI);
  if (uu < 0) uu += 1;
  return {
    lon: uu * 360 - 180,
    lat: Math.asin(Math.max(-1, Math.min(1, p.y))) / DEG,
  };
}

function lonLatToRotation(lon, lat) {
  // Compute globe rotation (as quaternion) that shows (lon, lat) at center
  // using YXZ decomposition: Y spins to longitude, X tilts to latitude
  // This guarantees north stays up (no roll)
  const u = (lon + 180) / 360;
  const v = (90 - lat) / 180;
  const theta = v * Math.PI;
  const phi = u * 2 * Math.PI;
  const px = -Math.cos(phi) * Math.sin(theta);
  const py = Math.cos(theta);
  const pz = Math.sin(phi) * Math.sin(theta);

  const ry = Math.atan2(-px, pz);
  const qz = Math.sqrt(px * px + pz * pz); // always positive
  const rx = Math.atan2(py, qz);

  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rx, ry, 0, "YXZ"),
  );
}

function startRecenterAnimation(cf) {
  const centroid = getCountryCentroid(cf);
  if (!centroid) return;

  // Current center
  const from = getCenterLonLat();

  // Shortest longitude path (wrap around ±180)
  let deltaLon = centroid.lon - from.lon;
  if (deltaLon > 180) deltaLon -= 360;
  if (deltaLon < -180) deltaLon += 360;

  recenterAnim = {
    startTime: performance.now(),
    duration: 2000,
    fromLon: from.lon,
    fromLat: from.lat,
    deltaLon: deltaLon,
    deltaLat: 0, // No vertical rotation — north stays up, no tilt change
    fromCamZ: camera.position.z,
    toCamZ: 2.2,
  };

  // Stop any inertia
  velocity = { lon: 0, lat: 0 };
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
    });
    chickenGroup = new THREE.Sprite(mat);
    // Aspect ratio of the image (~1.4:1 landscape)
    chickenGroup.scale.set(0.7, 0.55, 1);
    scene.add(chickenGroup);
  });
}

// Speed lines are now drawn on 2D overlay canvas (see drawSpeedLines)

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

  // Reset camera
  camera.position.set(0, 0, CAM_START_Z);

  // Pick random country
  currentTarget =
    countryFeatures[Math.floor(Math.random() * countryFeatures.length)];

  document.getElementById("country-name").textContent = currentTarget.nameFr;
  document.getElementById("score-display").textContent =
    "Question " + round + " / " + MAX_ROUNDS;

  // Reset timer
  timerStart = performance.now();
  const bar = document.getElementById("timer-bar");
  bar.style.width = "100%";
  bar.classList.remove("warning");

  lastHighlightId = null;
}

let lastHighlightId = null;

function endGame() {
  roundActive = false;
  showScreen("end-screen");

  let msg;
  if (score >= 4) msg = "Incroyable ! ";
  else if (score >= 3) msg = "Bien joué ! ";
  else msg = "Continue de t\u2019entraîner ! ";

  document.getElementById("final-score").textContent =
    msg + score + " / " + MAX_ROUNDS;
}

// ── Input Handling ──────────────────────────────────────────
function setupInput() {
  const container = document.getElementById("scene-container");

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    dragPrev = { x: e.clientX, y: e.clientY };
    velocity = { lon: 0, lat: 0 };
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging || recenterAnim) return;
    const dx = e.clientX - dragPrev.x;
    const dy = e.clientY - dragPrev.y;
    const sensitivity = 0.005;
    globeRotY -= dx * sensitivity;
    globeRotX -= dy * sensitivity;
    globeRotX = Math.max(-1.4, Math.min(1.4, globeRotX));
    velocity = { lon: -dx * sensitivity, lat: -dy * sensitivity };
    dragPrev = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener(
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

  window.addEventListener("touchend", () => { dragging = false; }, { passive: true });

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || recenterAnim || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragPrev.x;
      const dy = e.touches[0].clientY - dragPrev.y;
      const sensitivity = 0.005;
      globeRotY -= dx * sensitivity;
      globeRotX -= dy * sensitivity;
      globeRotX = Math.max(-1.4, Math.min(1.4, globeRotX));
      velocity = { lon: -dx * sensitivity, lat: -dy * sensitivity };
      dragPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true },
  );
}

// ── Inertia ─────────────────────────────────────────────────
function applyInertia() {
  if (dragging || recenterAnim) return;
  globeRotY += velocity.lon;
  globeRotX -= velocity.lat;
  globeRotX = Math.max(-1.4, Math.min(1.4, globeRotX));
  velocity.lon *= 0.92;
  velocity.lat *= 0.92;
  if (Math.abs(velocity.lon) < 0.0001) velocity.lon = 0;
  if (Math.abs(velocity.lat) < 0.0001) velocity.lat = 0;
}

// ── Timer & Round ───────────────────────────────────────────
function updateTimer() {
  if (!roundActive) return;

  const elapsed = (performance.now() - timerStart) / 1000;
  const remaining = Math.max(0, ROUND_TIME - elapsed);
  const frac = remaining / ROUND_TIME;

  // Ease-in cubic: t³ — earth starts far and accelerates toward camera
  const t = 1 - frac;
  chickenY = t * t * t;
  // Remap to 0-1 for the full range since t³ at t=1 is 1
  // chickenY is already 0→1

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
  const correct = hoveredCountry && hoveredCountry.id === currentTarget.id;

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
    buildGlobeTexture(null, currentTarget.id);

    // Recenter globe on correct country + zoom in
    startRecenterAnimation(currentTarget);

    // Position chicken-point just to the right of the country (which will be centered)
    const imgH = Math.min(window.innerWidth * 0.4, 220) * 0.8;
    fbChicken.src = "chicken-point.png";
    fbChicken.style.left = (window.innerWidth / 2 + 60) + "px";
    fbChicken.style.top = (window.innerHeight / 2 - imgH / 2) + "px";
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
    // Speed lines around chicken
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
  // Lines radiate outward from chicken position (slightly below center)
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
  updateTimer();

  // Recenter animation (on wrong answer: interpolate lon/lat, north stays up)
  if (recenterAnim) {
    const elapsed = performance.now() - recenterAnim.startTime;
    const t = Math.min(1, elapsed / recenterAnim.duration);
    // Ease-in-out cubic
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const lon = recenterAnim.fromLon + recenterAnim.deltaLon * e;
    const lat = recenterAnim.fromLat + recenterAnim.deltaLat * e;

    // Compute rotation that shows (lon, lat) at center with north up
    const q = lonLatToRotation(lon, lat);
    globeMesh.quaternion.copy(q);

    camera.position.z = recenterAnim.fromCamZ + (recenterAnim.toCamZ - recenterAnim.fromCamZ) * e;

    if (t >= 1) {
      // Convert final quaternion back to XYZ Euler for drag interactions
      const finalEuler = new THREE.Euler().setFromQuaternion(q, "XYZ");
      globeRotX = finalEuler.x;
      globeRotY = finalEuler.y;
      recenterAnim = null;
    }
  }

  // Update globe rotation (skip during recenter which sets quaternion directly)
  if (!recenterAnim) {
    globeMesh.rotation.set(globeRotX, globeRotY, 0);
  }

  // Camera dive animation
  if (roundActive) {
    const z = CAM_START_Z - (CAM_START_Z - CAM_END_Z) * chickenY;
    camera.position.z = z;
  }

  // Position chicken between camera and globe, just below crosshair
  if (chickenGroup) {
    // Hide 3D chicken sprite when round is not active (e.g. during recenter feedback)
    chickenGroup.visible = roundActive;

    if (roundActive) {
      const chickenZ = camera.position.z - 1.2;
      chickenGroup.position.set(0, -0.1, chickenZ);
      chickenGroup.renderOrder = 999;

      // Slight bobbing
      const bob = Math.sin(performance.now() * 0.005) * 0.02 * (1 - chickenY);
      chickenGroup.position.y += bob;

      // Scale: small sprite, shrinks slightly during dive
      const baseW = 0.32;
      const baseH = 0.25;
      const s = 1.0 - chickenY * 0.15;
      chickenGroup.scale.set(baseW * s, baseH * s, 1);
    }
  }

  // Highlight country at center
  if (roundActive && geoData) {
    const hovered = getCountryAtCenter();
    const hoveredId = hovered ? hovered.id : null;
    if (hoveredId !== lastHighlightId) {
      lastHighlightId = hoveredId;
      buildGlobeTexture(hoveredId);
    }
  }

  renderer.render(scene, camera);
  updateAndDrawParticles();

  requestAnimationFrame(renderLoop);
}
