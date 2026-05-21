
let inkLayer;
let inkPath;
let pressTimer;
let animationId;
let inking = false;
let points = [];
let cx = 0;
let cy = 0;
let radius = 0;
let startTime = 0;

document.addEventListener("pointerdown", (e) => {
  if (inking) return;

  pressTimer = setTimeout(() => {
    startInk(e.clientX, e.clientY);
  }, 2000);
});

document.addEventListener("pointerup", stopInk);
document.addEventListener("pointercancel", stopInk);
document.addEventListener("pointerleave", stopInk);

function startInk(x, y) {
  if (inking) return;

  cx = x;
  cy = y;
  radius = 10;
  startTime = performance.now();
  inking = true;

  if (!inkLayer) {
    inkLayer = document.createElement("div");
    inkLayer.className = "blind-ink";
    inkLayer.innerHTML = `<svg></svg>`;
    document.body.appendChild(inkLayer);
  }

  inkPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  inkLayer.querySelector("svg").appendChild(inkPath);

  points = Array.from({ length: 90 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 90;

    return {
      angle,
      r: 6 + Math.random() * 4,
      speed: 0.7 + Math.random() * 1.8,
      maxBoost: 0.85 + Math.random() * 0.5
    };
  });

  animateInk();
}

function stopInk() {
  clearTimeout(pressTimer);
  inking = false;
  cancelAnimationFrame(animationId);
}

function animateInk() {
  if (!inking) return;

  const age = (performance.now() - startTime) / 1000;
  const drag = Math.exp(-age * 0.38);

  const oldRadii = points.map((p) => p.r);
  const avgR = oldRadii.reduce((a, b) => a + b, 0) / oldRadii.length;

  points.forEach((p, i) => {
    if (Math.random() < 0.012 && age < 5) {
      p.speed = Math.min(p.speed * 1.8, 5);
    }

    const prev = oldRadii[(i - 1 + oldRadii.length) % oldRadii.length];
    const next = oldRadii[(i + 1) % oldRadii.length];
    const neighbourAvg = (prev + next) / 2;

    const organicSpread = p.speed * p.maxBoost * drag;
    const surfaceTension = (neighbourAvg - p.r) * 0.16;
    const catchUp = Math.max(0, avgR - p.r) * 0.005;
    const edgePenalty = Math.max(0, p.r - avgR) * 0.15;

    p.r += Math.max(
      0.015,
      organicSpread + surfaceTension + catchUp - edgePenalty
    );
  });

  radius = points.reduce((sum, p) => sum + p.r, 0) / points.length;

  drawBlob();
  checkAdditionalConsoles();

  animationId = requestAnimationFrame(animateInk);
}

function drawBlob() {
  const vertices = points.map((p) => {
    return {
      x: cx + Math.cos(p.angle) * p.r,
      y: cy + Math.sin(p.angle) * p.r
    };
  });

  let d = "";

  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    const mx = (current.x + next.x) / 2;
    const my = (current.y + next.y) / 2;

    if (i === 0) {
      d += `M ${mx} ${my}`;
    }

    d += ` Q ${current.x} ${current.y} ${mx} ${my}`;
  }

  d += " Z";

  inkPath.setAttribute("d", d);
}

function checkAdditionalConsoles() {
  document.querySelectorAll("[data-additional-console]:not(.is-found)").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const distance = Math.hypot(x - cx, y - cy);

    if (distance < radius) {
      el.classList.add("is-found");
    }
  });
}