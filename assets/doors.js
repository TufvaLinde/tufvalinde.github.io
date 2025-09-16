/**
 * Masonry via absolut positionering + progressiv inladdning:
 * - Shufflar ordningen vid sidladdning
 * - Reserverar plats med aspect-ratio (ingen layout-jank)
 * - Fadar in bilder när de laddat
 * - Relayout på varje enskild bild som blir klar + vid resize
 * - Drift-animation separat (på .door)
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

function seedRng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

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

function animateDrift(){
  if (prefersReduced) return;
  const doors = Array.from(document.querySelectorAll('#doors-grid .door'));
  if (!doors.length) return;
  const P = doors.map((_,i)=>driftParams(i));
  let t0 = performance.now();
  function tick(now){
    const t = (now - t0)/1000;
    for (let i=0;i<doors.length;i++){
      const el = doors[i], p = P[i];
      const dx = Math.sin(t*p.wx + p.phx) * p.ampX;
      const dy = Math.cos(t*p.wy + p.phy) * p.ampY;
      const r  = Math.sin(t*p.wr + p.phr) * p.rotA;
      el.style.setProperty('--dx', dx.toFixed(1)+'px');
      el.style.setProperty('--dy', dy.toFixed(1)+'px');
      el.style.setProperty('--rot', r.toFixed(2)+'deg');
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* Masonry-läggning */
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
    const h = card.offsetHeight; // inkluderar skeleton / redan inladdad bild
    let k = 0; for (let i=1;i<cols;i++) if (heights[i] < heights[k]) k = i;
    const x = k*(colW + gap), y = heights[k];
    card.style.left = x+'px';
    card.style.top  = y+'px';
    heights[k] = y + h + gap;
  }

  const H = Math.max(...heights, 0);
  grid.style.height = H + 'px';
  grid.classList.remove('measuring');
}

/* Shuffla DOM-barn en gång per laddning */
function shuffleDom(){
  const grid = document.getElementById('doors-grid'); if (!grid) return;
  const kids = Array.from(grid.children);
  for (let i = kids.length - 1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    grid.appendChild(kids[j]);
    kids.splice(j,1);
  }
}

/* När en bild laddat: sätt exakt ratio, fadda in, relayout */
function wireImage(img, relayout){
  if (!img) return;
  const wrap = img.closest('.door-media');
  const onload = () => {
    // sätt korrekt aspect-ratio så kortets höjd blir exakt
    if (img.naturalWidth && img.naturalHeight){
      wrap.style.setProperty('--ratio', (img.naturalWidth / img.naturalHeight));
    }
    wrap.classList.add('is-loaded'); // släck skeleton, visa bild
    relayout();
  };
  if (img.complete) onload();
  else {
    img.addEventListener('load', onload, {once:true});
    img.addEventListener('error', onload, {once:true}); // visa ändå, så layout flyter vidare
  }
}

/* Debounce */
function debounce(fn, ms=120){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

function init(){
  const grid = document.getElementById('doors-grid'); if (!grid) return;

  shuffleDom();     // klient-side shuffle (direkt)
  layoutMasonry();  // initial layout med skeleton-ratios

  // koppla alla bilder för progressiv inladdning
  const relayout = debounce(layoutMasonry, 60);
  document.querySelectorAll('#doors-grid img').forEach(img => wireImage(img, relayout));

  // relayout på resize
  window.addEventListener('resize', debounce(layoutMasonry, 150), {passive:true});

  // starta drift när vi har första layouterna
  animateDrift();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, {once:true});
} else {
  init();
}