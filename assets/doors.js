const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

function seedRng(seed){ let s = seed >>> 0; return () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296; }

function driftParams(i){
  const rng = seedRng(i + 7331);
  const amp = 8;
  return {
    ampX: amp * (0.7 + rng()*0.6),
    ampY: amp * (0.7 + rng()*0.6),
    rotA: 0.5 + rng()*0.35,
    wx: 0.35 + rng()*0.25,
    wy: 0.40 + rng()*0.25,
    wr: 0.20 + rng()*0.15,
    phx: rng()*TAU, phy: rng()*TAU, phr: rng()*TAU
  };
}

let raf = null, startT = 0, elapsed = 0, doors = [], params = [];

function tick(now){
  const t = elapsed + (now - startT)/1000;
  for (let i=0;i<doors.length;i++){
    const el = doors[i], p = params[i];
    const dx = Math.sin(t*p.wx + p.phx) * p.ampX;
    const dy = Math.cos(t*p.wy + p.phy) * p.ampY;
    const r  = Math.sin(t*p.wr + p.phr) * p.rotA;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${r}deg)`;
  }
  raf = requestAnimationFrame(tick);
}

function start(){
  if (prefersReduced) return;
  doors = Array.from(document.querySelectorAll('#doors-grid .door'));
  if (!doors.length) return;
  if (!params.length) params = doors.map((_,i)=>driftParams(i));
  startT = performance.now();
  raf = requestAnimationFrame(tick);
}
function stop(){ if (raf) { cancelAnimationFrame(raf); raf = null; } }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (raf) { elapsed += (performance.now() - startT)/1000; stop(); }
  } else {
    startT = performance.now();
    if (!raf && !prefersReduced) raf = requestAnimationFrame(tick);
  }
}, {passive:true});

function layoutMasonry(){
  const grid = document.getElementById('doors-grid'); if (!grid) return;
  const gap = parseFloat(getComputedStyle(grid).getPropertyValue('--gap')) || 24;
  const W   = grid.clientWidth;
  const baseCol = parseFloat(getComputedStyle(grid).getPropertyValue('--colw')) || 240;

  let cols = Math.max(1, Math.floor((W + gap) / (baseCol + gap)));
  const colW = Math.floor((W - gap*(cols-1)) / cols);
  grid.style.setProperty('--colw', colW + 'px');

  const cards = Array.from(grid.children);
  grid.classList.add('measuring');

  const heights = new Array(cols).fill(0);
  for (const card of cards){
    card.style.width = colW + 'px';
    const h = card.offsetHeight;
    let k = 0; for (let i=1;i<cols;i++) if (heights[i] < heights[k]) k = i;
    const x = k*(colW + gap), y = heights[k];
    card.style.left = x+'px';
    card.style.top  = y+'px';
    heights[k] = y + h + gap;
  }
  grid.style.height = Math.max(...heights, 0) + 'px';
  grid.classList.remove('measuring');
}

function shuffleDom(){
  const grid = document.getElementById('doors-grid'); if (!grid) return;
  const kids = Array.from(grid.children);
  for (let i = kids.length - 1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    grid.appendChild(kids[j]);
    kids.splice(j,1);
  }
}

function wireImage(img, relayout){
  if (!img) return;
  const wrap = img.closest('.door-media');
  const onload = () => {
    if (img.naturalWidth && img.naturalHeight){
      wrap.style.setProperty('--ratio', (img.naturalWidth / img.naturalHeight));
    }
    wrap.classList.add('is-loaded');
    relayout();
  };
  if (img.complete) onload();
  else {
    img.addEventListener('load', onload, {once:true});
    img.addEventListener('error', onload, {once:true});
  }
}

function debounce(fn, ms=120){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

function init(){
  const grid = document.getElementById('doors-grid'); if (!grid) return;

  shuffleDom();
  layoutMasonry();

  const relayout = debounce(layoutMasonry, 60);
  document.querySelectorAll('#doors-grid img').forEach(img => wireImage(img, relayout));
  window.addEventListener('resize', debounce(layoutMasonry, 150), {passive:true});

  start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, {once:true});
} else {
  init();
}