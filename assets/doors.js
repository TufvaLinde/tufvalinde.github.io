const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

function seedRng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function makeParams(el, index) {
  const rng = seedRng(index + 1337);
  const ampBase = 8;
  const ampX = ampBase * (0.7 + rng() * 0.6);
  const ampY = ampBase * (0.7 + rng() * 0.6);
  const rotAmp = 0.5 + rng() * 0.35;

  const wx = 0.35 + rng() * 0.25;
  const wy = 0.40 + rng() * 0.25;
  const wr = 0.20 + rng() * 0.15;

  const phx = rng() * TAU;
  const phy = rng() * TAU;
  const phr = rng() * TAU;

  return { ampX, ampY, rotAmp, wx, wy, wr, phx, phy, phr };
}

function animateDrift() {
  if (prefersReduced) return;
  const doors = Array.from(document.querySelectorAll('#doors-grid .door'));
  if (!doors.length) return;

  const params = doors.map((el, i) => makeParams(el, i));
  let start = performance.now();

  function frame(now) {
    const t = (now - start) / 1000;
    for (let i = 0; i < doors.length; i++) {
      const el = doors[i];
      const p = params[i];
      const dx = Math.sin(t * p.wx + p.phx) * p.ampX;
      const dy = Math.cos(t * p.wy + p.phy) * p.ampY;
      const rot = Math.sin(t * p.wr + p.phr) * p.rotAmp;
      el.style.setProperty('--dx', dx.toFixed(1) + 'px');
      el.style.setProperty('--dy', dy.toFixed(1) + 'px');
      el.style.setProperty('--rot', rot.toFixed(2) + 'deg');
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function shuffleNodes(nodes) {
  const a = nodes.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function layoutMasonry() {
  const grid = document.getElementById('doors-grid');
  if (!grid) return;

  const gap = parseFloat(getComputedStyle(grid).getPropertyValue('--gap')) || 24;

  const W = grid.clientWidth;
  const cssColW = parseFloat(getComputedStyle(grid).getPropertyValue('--colw')) || 240;
  let cols = Math.max(1, Math.floor((W + gap) / (cssColW + gap)));
  const colW = Math.floor((W - gap * (cols - 1)) / cols);

  grid.style.setProperty('--colw', colW + 'px');

  const cards = Array.from(grid.children);

  grid.classList.add('measuring');

  const heights = new Array(cols).fill(0);

  for (const card of cards) {
    card.style.width = colW + 'px';
    const h = card.offsetHeight;

    let k = 0;
    for (let i = 1; i < cols; i++) {
      if (heights[i] < heights[k]) k = i;
    }

    const x = k * (colW + gap);
    const y = heights[k];

    card.style.left = x + 'px';
    card.style.top  = y + 'px';

    heights[k] = y + h + gap;
  }

  const H = Math.max(...heights, 0);
  grid.style.height = H + 'px';

  grid.classList.remove('measuring');
}

function afterImagesLoad(cb) {
  const grid = document.getElementById('doors-grid');
  if (!grid) return cb();
  const imgs = Array.from(grid.querySelectorAll('img'));
  if (!imgs.length) return cb();
  let left = imgs.length, done = false;
  const check = () => { if (!done && --left <= 0) { done = true; cb(); } };
  imgs.forEach(img => {
    if (img.complete) check();
    else {
      img.addEventListener('load', check, { once: true });
      img.addEventListener('error', check, { once: true });
    }
  });
}

function shuffleDomOnce() {
  const grid = document.getElementById('doors-grid');
  if (!grid) return;
  const items = Array.from(grid.children);
  const shuffled = shuffleNodes(items);
  shuffled.forEach(n => grid.appendChild(n));
}

function debounce(fn, ms=120) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function init() {
  const grid = document.getElementById('doors-grid');
  if (!grid) return;

  shuffleDomOnce();
  afterImagesLoad(() => {
    layoutMasonry();
    animateDrift();
  });

  const onResize = debounce(() => layoutMasonry(), 150);
  window.addEventListener('resize', onResize, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}