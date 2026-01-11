import * as THREE from "three";
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

function makeTextTexture(text, fontPx = 90) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");

  const pad = Math.ceil(fontPx * 0.6);
  ctx.font = `${fontPx}px Times New Roman`;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + pad * 2);
  const h = Math.ceil(fontPx + pad * 2);

  c.width = w;
  c.height = h;

  ctx.font = `${fontPx}px Times New Roman`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, w, h };
}

function makeWordSprite(word) {
  const { tex, w, h } = makeTextTexture(word, 90);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);

  const scale = 0.45;
  sprite.scale.set(w * scale * 0.12, h * scale * 0.12, 1);

  return sprite;
}

function fibonacciSpherePoints(n, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return pts;
}

async function loadWords(url) {
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();
  const words = txt
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(s => s.replace(/[^\p{L}\p{N}\-’']/gu, ""))
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  for (const w of words) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(w);
    }
  }
  return unique;
}

export async function initTextSphere({
  containerId,
  textUrl,
  radius = 110,
  maxWords = 600,
  fontFamily = "Times New Roman",
} = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    2000
  );

  camera.position.set(0, 0, radius * 3);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);
  controls.update();


  const lightA = new THREE.DirectionalLight(0xffffff, 0.9);
  lightA.position.set(1, 1, 1);
  scene.add(lightA);

  const lightB = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(lightB);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (w === 0 || h === 0) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }


  window.addEventListener("resize", resize);
  resize();

  const group = new THREE.Group();
  scene.add(group);

  let spin = 0.0016;

  const words = await loadWords(textUrl);
  const count = Math.min(words.length, maxWords);
  const pts = fibonacciSpherePoints(count, radius);

  for (let i = 0; i < count; i++) {
    const sprite = makeWordSprite(words[i]);
    sprite.position.copy(pts[i]);
    group.add(sprite);
  }

  function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += spin;
    group.rotation.x += spin * 0.35;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  container.addEventListener("pointerdown", () => { spin *= 1.12; });
  container.addEventListener("dblclick", () => { spin = 0.0016; });
}