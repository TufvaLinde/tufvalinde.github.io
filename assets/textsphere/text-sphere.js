import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function makeTextTexture(text, fontPx, fontFamily, fontWeight, color) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  const padX = Math.ceil(fontPx * 0.9);
  const padY = Math.ceil(fontPx * 0.8);

  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const w = Math.max(2, Math.ceil(metrics.width + padX * 2));
  const h = Math.max(2, Math.ceil(fontPx + padY * 2));

  c.width = w;
  c.height = h;

  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  return { tex, w, h };
}

function makeLineSprite(line, opts) {
  const { tex, w, h } = makeTextTexture(
    line,
    opts.fontPx,
    opts.fontFamily,
    opts.fontWeight,
    opts.color
  );

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(mat);

  const pxToWorld = opts.pxToWorld;
  sprite.scale.set(w * pxToWorld, h * pxToWorld, 1);

  return sprite;
}

async function loadLines(url, mode) {
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();

  if (mode === "lines") {
    return txt
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  const normalized = txt.replace(/\s+/g, " ").trim();
  const parts = normalized
    .split(/(?<=[.!?…])\s+/u)
    .map(s => s.trim())
    .filter(Boolean);

  return parts.length ? parts : normalized ? [normalized] : [];
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export async function initTextSphere({
  containerId,
  textUrl,
  radius = 110,
  slices = 14,
  maxLines = 80,
  spin = 0.002,
  draggable = true,
  parse = "sentences",
  fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontWeight = "900",
  fontPx = 100,
  color = "rgba(24, 24, 24, 1)",
  pxToWorld = 0.055,
  verticalPadding = 0.08
} = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const lightA = new THREE.DirectionalLight(0xffffff, 0.9);
  lightA.position.set(1, 1, 1);
  scene.add(lightA);

  const lightB = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(lightB);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", resize);
  resize();

  const opts = { fontFamily, fontWeight, fontPx, color, pxToWorld };

  const linesRaw = await loadLines(textUrl, parse);
  const lines = linesRaw.slice(0, maxLines);

  const group = new THREE.Group();
  scene.add(group);

  const n = Math.max(1, lines.length);
  const latStart = Math.PI / 2;
  const latEnd = -Math.PI / 2;
  const step = (latStart - latEnd) / Math.max(1, n - 1);

  const latitudes = [];
  for (let i = 0; i < n; i++) {
    const lat = latStart - step * i;
    latitudes.push(clamp(lat, -Math.PI / 2, Math.PI / 2));
  }

  const eps = verticalPadding;
  for (let i = 0; i < latitudes.length; i++) {
    latitudes[i] = clamp(latitudes[i], -Math.PI / 2 + eps, Math.PI / 2 - eps);
  }

  for (let s = 0; s < slices; s++) {
    const lon = (s / slices) * Math.PI * 2;

    for (let i = 0; i < n; i++) {
      const lat = latitudes[i];

      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);

      const sprite = makeLineSprite(lines[i], opts);
      sprite.position.set(x, y, z);

      sprite.material.rotation = -Math.PI / 2;

      sprite.lookAt(sprite.position.clone().multiplyScalar(1.2));

      const outward = new THREE.Vector3(x, y, z).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const tangentLon = new THREE.Vector3().crossVectors(up, outward).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangentLon);
      sprite.quaternion.premultiply(q);

      group.add(sprite);
    }
  }

  let currentSpin = spin;
  let dragging = false;
  let lastX = 0;

  if (draggable) {
    container.style.touchAction = "pan-y";

    container.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      group.rotation.y += dx * 0.004;
    });

    container.addEventListener("pointerup", () => {
      dragging = false;
    });

    container.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  container.addEventListener("dblclick", () => {
    currentSpin = spin;
  });

  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += currentSpin;
    renderer.render(scene, camera);
  }
  animate();
}