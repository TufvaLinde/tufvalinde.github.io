(async () => {
  const viewport = document.getElementById("logViewport");
  const stage = document.getElementById("logStage");
  const overlay = document.getElementById("logOverlay");
  const overlayHeader = document.getElementById("logOverlayHeader");
  const overlayBody = document.getElementById("logOverlayBody");

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    stage.textContent = `Could not load logs.json (${res.status})`;
    return;
  }
  const items = await res.json();

  const byDay = new Map();
  let minKey = null;
  let maxKey = null;

  for (const it of items) {
    const d = new Date(it.ts_iso);
    const key = d.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(it);
    if (!minKey || key < minKey) minKey = key;
    if (!maxKey || key > maxKey) maxKey = key;
  }

  for (const [k, arr] of byDay.entries()) {
    arr.sort((a, b) => (a.ts_iso < b.ts_iso ? -1 : 1));
  }

  function parseDayKeyUTC(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function dayKeyFromUTC(dt) {
    return dt.toISOString().slice(0, 10);
  }

  function addDaysUTC(dt, n) {
    const x = new Date(dt.getTime());
    x.setUTCDate(x.getUTCDate() + n);
    return x;
  }

  function monthKeyUTC(dt) {
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  function monthLabel(dt) {
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const mm = String(m).padStart(2, "0");
    return `${y}-${mm}`;
  }

  const marginDays = 45;
  const minDate = addDaysUTC(parseDayKeyUTC(minKey), -marginDays);
  const maxDate = addDaysUTC(parseDayKeyUTC(maxKey), marginDays);

  const timeline = [];
  let cursor = new Date(minDate.getTime());
  let lastMonth = null;

  while (cursor <= maxDate) {
    const mk = monthKeyUTC(cursor);
    if (mk !== lastMonth) {
      timeline.push({ type: "month", label: monthLabel(cursor), y: cursor.getUTCFullYear(), m: cursor.getUTCMonth() + 1 });
      lastMonth = mk;
    }
    const dk = dayKeyFromUTC(cursor);
    timeline.push({ type: "day", key: dk, d: cursor.getUTCDate(), y: cursor.getUTCFullYear(), m: cursor.getUTCMonth() + 1 });
    cursor = addDaysUTC(cursor, 1);
  }

  const levels = [
    { id: "far",  cellPx: 10, fontPx: 8,  padPx: 1 },
    { id: "mid",  cellPx: 22, fontPx: 12, padPx: 2 },
    { id: "near", cellPx: 44, fontPx: 16, padPx: 3 },
    { id: "one",  cellPx: 84, fontPx: 20, padPx: 4 }
  ];

  let levelIndex = 1;

  const cam = {
    cellPx: levels[levelIndex].cellPx,
    x: 0,
    y: 0
  };

  const snap = {
    active: false,
    t0: 0,
    dur: 170,
    fromCellPx: 0,
    toCellPx: 0
  };

  let vw = 0;
  let vh = 0;
  let poolCols = 0;
  let poolRows = 0;
  let pool = [];
  let dirty = true;

  const worldCols = 7;

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function worldIndexAt(col, row) {
    return row * worldCols + col;
  }

  function worldCellToXY(col, row) {
    return {
      x: col * cam.cellPx + cam.x,
      y: row * cam.cellPx + cam.y
    };
  }

  function visibleTopLeftWorld() {
    const col0 = Math.floor((-cam.x) / cam.cellPx);
    const row0 = Math.floor((-cam.y) / cam.cellPx);
    return { col0, row0 };
  }

  function ensurePool() {
    vw = viewport.clientWidth;
    vh = viewport.clientHeight;

    const needCols = Math.ceil(vw / cam.cellPx) + 3;
    const needRows = Math.ceil(vh / cam.cellPx) + 3;

    if (needCols === poolCols && needRows === poolRows) return;

    poolCols = needCols;
    poolRows = needRows;

    stage.innerHTML = "";
    pool = [];

    const frag = document.createDocumentFragment();

    for (let r = 0; r < poolRows; r++) {
      for (let c = 0; c < poolCols; c++) {
        const el = document.createElement("div");
        el.className = "logCell";

        const inner = document.createElement("div");
        inner.className = "logCellInner";

        const text = document.createElement("div");
        text.className = "logCellText";

        inner.appendChild(text);
        el.appendChild(inner);

        el.addEventListener("click", () => {
          const idx = Number(el.dataset.worldIndex);
          const entry = timeline[idx];
          if (!entry) return;
          if (entry.type !== "day") return;
          const arr = byDay.get(entry.key);
          if (!arr || !arr.length) {
            overlay.classList.remove("open");
            return;
          }
          overlay.classList.add("open");
          overlayHeader.textContent = entry.key;
          overlayBody.innerHTML = arr.map(x => {
            const head = `${x.ts_display}`;
            return `<div style="margin-bottom:10px"><div style="opacity:.75;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:12px">${head}</div>${x.html}</div>`;
          }).join("");
        });

        pool.push(el);
        frag.appendChild(el);
      }
    }

    stage.appendChild(frag);
    dirty = true;
  }

  function setSnapToNearest() {
    const current = cam.cellPx;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < levels.length; i++) {
      const d = Math.abs(levels[i].cellPx - current);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    levelIndex = best;

    snap.active = true;
    snap.t0 = performance.now();
    snap.fromCellPx = current;
    snap.toCellPx = levels[levelIndex].cellPx;
  }

  function applyCellMetrics() {
    const lvl = levels[levelIndex];
    for (const el of pool) {
      el.style.width = `${cam.cellPx}px`;
      el.style.height = `${cam.cellPx}px`;
      el.style.fontSize = `${lvl.fontPx}px`;
      el.firstChild.style.padding = `${lvl.padPx}px`;
    }
  }

  function render() {
    ensurePool();

    const tl = visibleTopLeftWorld();
    const startCol = tl.col0;
    const startRow = tl.row0;

    const lvl = levels[levelIndex];

    for (let r = 0; r < poolRows; r++) {
      for (let c = 0; c < poolCols; c++) {
        const poolIdx = r * poolCols + c;
        const el = pool[poolIdx];

        const worldCol = startCol + c;
        const worldRow = startRow + r;

        const worldIdx = worldIndexAt(worldCol, worldRow);

        el.dataset.worldIndex = String(worldIdx);

        const pos = worldCellToXY(worldCol, worldRow);
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;

        el.classList.remove("logCellMonth", "logCellHas");

        const text = el.firstChild.firstChild;

        const entry = timeline[worldIdx];
        if (!entry) {
          text.textContent = "";
          continue;
        }

        if (entry.type === "month") {
          el.classList.add("logCellMonth");
          if (lvl.id === "far") text.textContent = entry.label.slice(5);
          else text.textContent = entry.label;
          continue;
        }

        const has = byDay.has(entry.key);
        if (has) el.classList.add("logCellHas");

        if (lvl.id === "far") {
          text.textContent = has ? "•" : "";
        } else if (lvl.id === "mid") {
          text.textContent = String(entry.d);
        } else if (lvl.id === "near") {
          text.textContent = has ? `${entry.d}•` : String(entry.d);
        } else {
          const arr = byDay.get(entry.key);
          if (arr && arr.length) {
            const first = arr[0];
            text.textContent = first.ts_display;
          } else {
            text.textContent = String(entry.d);
          }
        }
      }
    }
  }

  function tick(now) {
    if (snap.active) {
      const t = clamp((now - snap.t0) / snap.dur, 0, 1);
      cam.cellPx = snap.fromCellPx + (snap.toCellPx - snap.fromCellPx) * ease(t);
      if (t >= 1) {
        cam.cellPx = snap.toCellPx;
        snap.active = false;
        applyCellMetrics();
        ensurePool();
      }
      dirty = true;
    }

    if (dirty) {
      applyCellMetrics();
      render();
      dirty = false;
    }

    requestAnimationFrame(tick);
  }

  function zoomAt(clientX, clientY, factor) {
    const old = cam.cellPx;
    const next = clamp(old * factor, levels[0].cellPx, levels[levels.length - 1].cellPx);

    const rect = viewport.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;

    const worldX = (vx - cam.x) / old;
    const worldY = (vy - cam.y) / old;

    cam.cellPx = next;
    cam.x = vx - worldX * next;
    cam.y = vy - worldY * next;

    dirty = true;
  }

  let pointers = new Map();
  let panStart = null;
  let pinchStart = null;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  viewport.addEventListener("pointerdown", (e) => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    overlay.classList.remove("open");

    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
    }

    if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      pinchStart = { d: dist(p1, p2), cellPx: cam.cellPx, cx: center.x, cy: center.y };
      panStart = null;
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && panStart) {
      const p = Array.from(pointers.values())[0];
      cam.x = panStart.camX + (p.x - panStart.x);
      cam.y = panStart.camY + (p.y - panStart.y);
      dirty = true;
      return;
    }

    if (pointers.size === 2 && pinchStart) {
      const [p1, p2] = Array.from(pointers.values());
      const dNow = dist(p1, p2);
      const ratio = dNow / pinchStart.d;
      const factor = ratio;

      zoomAt(pinchStart.cx, pinchStart.cy, clamp((pinchStart.cellPx * factor) / cam.cellPx, 0.2, 5));
      dirty = true;
    }
  });

  function endInteraction() {
    pointers.clear();
    panStart = null;
    pinchStart = null;
    setSnapToNearest();
    dirty = true;
  }

  viewport.addEventListener("pointerup", endInteraction);
  viewport.addEventListener("pointercancel", endInteraction);

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.002);
    zoomAt(e.clientX, e.clientY, factor);
    dirty = true;

    clearTimeout(viewport._snapT);
    viewport._snapT = setTimeout(() => {
      setSnapToNearest();
      dirty = true;
    }, 120);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartCellPx = null;
  let gestureCenter = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartCellPx = cam.cellPx;
    gestureCenter = { x: e.clientX, y: e.clientY };
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    const ratio = e.scale / gestureStartScale;
    const next = clamp(gestureStartCellPx * ratio, levels[0].cellPx, levels[levels.length - 1].cellPx);
    const factor = next / cam.cellPx;
    zoomAt(gestureCenter.x, gestureCenter.y, factor);
    dirty = true;
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    gestureStartScale = null;
    gestureStartCellPx = null;
    gestureCenter = null;
    setSnapToNearest();
    dirty = true;
  }, { passive: false });

  function initCamToRecent() {
    const idx = timeline.findIndex(x => x.type === "day" && x.key === maxKey);
    const target = idx >= 0 ? idx : 0;
    const row = Math.floor(target / worldCols);
    const col = target % worldCols;

    cam.cellPx = levels[levelIndex].cellPx;
    cam.x = viewport.clientWidth / 2 - (col + 0.5) * cam.cellPx;
    cam.y = viewport.clientHeight / 2 - (row + 0.5) * cam.cellPx;
    dirty = true;
  }

  window.addEventListener("resize", () => { dirty = true; });

  initCamToRecent();
  requestAnimationFrame(tick);
})();