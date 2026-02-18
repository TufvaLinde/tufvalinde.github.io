(async () => {
  const viewport = document.getElementById("logViewport");
  const grid = document.getElementById("logGrid");

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    grid.textContent = `Could not load logs.json (${res.status})`;
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

  const marginDays = 45;
  const minDate = addDaysUTC(parseDayKeyUTC(minKey), -marginDays);
  const maxDate = addDaysUTC(parseDayKeyUTC(maxKey), marginDays);

  const timeline = [];
  let cursor = new Date(minDate.getTime());
  let lastMonth = null;

  while (cursor <= maxDate) {
    const y = cursor.getUTCFullYear();
    const m0 = cursor.getUTCMonth();
    const mk = `${y}-${m0}`;
    if (mk !== lastMonth) {
      timeline.push({ type: "month", label: months[m0], y, m: m0 + 1 });
      lastMonth = mk;
    }
    timeline.push({ type: "day", key: dayKeyFromUTC(cursor), d: cursor.getUTCDate() });
    cursor = addDaysUTC(cursor, 1);
  }

  const levels = [
    { id: "far",  cell: 10, pad: 1, font: 7,  mode: "mark" },
    { id: "mid",  cell: 22, pad: 2, font: 12, mode: "date" },
    { id: "near", cell: 44, pad: 3, font: 14, mode: "time" },
    { id: "one",  cell: 84, pad: 4, font: 16, mode: "text" }
  ];

  let committedLevel = 1;
  let previewCell = levels[committedLevel].cell;

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function colsForCell(cellPx) {
    const cols = Math.max(1, Math.floor(viewport.clientWidth / cellPx));
    return cols;
  }

  function setVars(cellPx, lvl) {
    const cols = colsForCell(cellPx);
    grid.style.setProperty("--cell", `${cellPx}px`);
    grid.style.setProperty("--cols", `${cols}`);
    grid.style.setProperty("--pad", `${lvl.pad}px`);
    grid.style.setProperty("--font", `${lvl.font}px`);
    return cols;
  }

  function closestLevelFromCell(cellPx) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < levels.length; i++) {
      const d = Math.abs(levels[i].cell - cellPx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function anchorIndex(cellPxBefore, colsBefore) {
    const row = Math.floor(viewport.scrollTop / cellPxBefore);
    const idx = row * colsBefore;
    return clamp(idx, 0, timeline.length - 1);
  }

  function scrollToAnchor(idx, cellPxAfter, colsAfter) {
    const row = Math.floor(idx / colsAfter);
    viewport.scrollTop = row * cellPxAfter;
  }

  function render(mode) {
    const cols = colsForCell(previewCell);
    const lvl = levels[committedLevel];

    const frag = document.createDocumentFragment();

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];
      const cell = document.createElement("div");
      cell.className = "logCell";

      const inner = document.createElement("div");
      inner.className = "logInner";

      const text = document.createElement("div");
      text.className = "logText";

      if (entry.type === "month") {
        cell.classList.add("monthCell");
        text.textContent = entry.label;
      } else {
        const arr = byDay.get(entry.key);
        if (lvl.mode === "mark") {
          text.textContent = arr && arr.length ? "•" : "";
        } else if (lvl.mode === "date") {
          text.textContent = String(entry.d);
        } else if (lvl.mode === "time") {
          if (arr && arr.length) {
            text.textContent = arr[0].ts_display.slice(9);
          } else {
            text.textContent = String(entry.d);
          }
        } else {
          if (arr && arr.length) {
            const lines = arr.slice(0, 3).map(x => x.html.replace(/<[^>]*>/g, "").trim()).filter(Boolean);
            const t = arr[0].ts_display;
            const s = lines[0] ? lines[0] : "";
            text.textContent = s ? `${t} ${s}` : t;
          } else {
            text.textContent = String(entry.d);
          }
        }
      }

      inner.appendChild(text);
      cell.appendChild(inner);
      frag.appendChild(cell);
    }

    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  function applyPreview(cellPx) {
    const lvl = levels[committedLevel];
    previewCell = cellPx;
    setVars(previewCell, lvl);
  }

  function commitSnap(cellPxBefore, colsBefore, idx) {
    committedLevel = closestLevelFromCell(previewCell);
    previewCell = levels[committedLevel].cell;

    const lvl = levels[committedLevel];
    const colsAfter = setVars(previewCell, lvl);

    render(lvl.mode);
    scrollToAnchor(idx, previewCell, colsAfter);
  }

  function init() {
    const lvl = levels[committedLevel];
    const cols = setVars(previewCell, lvl);
    render(lvl.mode);

    const targetKey = maxKey;
    const targetIdx = timeline.findIndex(x => x.type === "day" && x.key === targetKey);
    if (targetIdx >= 0) scrollToAnchor(targetIdx, previewCell, cols);
  }

  init();

  let wheelSnapT = null;

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const lvl = levels[committedLevel];
    const colsBefore = colsForCell(previewCell);
    const idx = anchorIndex(previewCell, colsBefore);

    const k = Math.exp(-e.deltaY * 0.002);
    const next = clamp(previewCell * k, levels[0].cell, levels[levels.length - 1].cell);
    applyPreview(next);

    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(() => {
      commitSnap(previewCell, colsBefore, idx);
    }, 120);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartCell = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartCell = previewCell;
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const colsBefore = colsForCell(previewCell);
    const idx = anchorIndex(previewCell, colsBefore);

    const ratio = e.scale / gestureStartScale;
    const next = clamp(gestureStartCell * ratio, levels[0].cell, levels[levels.length - 1].cell);
    applyPreview(next);

    const lvl = levels[committedLevel];
    const colsAfter = setVars(previewCell, lvl);
    scrollToAnchor(idx, previewCell, colsAfter);
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const colsBefore = colsForCell(previewCell);
    const idx = anchorIndex(previewCell, colsBefore);

    gestureStartScale = null;
    gestureStartCell = null;

    commitSnap(previewCell, colsBefore, idx);
  }, { passive: false });

  window.addEventListener("resize", () => {
    const colsBefore = colsForCell(previewCell);
    const idx = anchorIndex(previewCell, colsBefore);
    const lvl = levels[committedLevel];
    const colsAfter = setVars(previewCell, lvl);
    render(lvl.mode);
    scrollToAnchor(idx, previewCell, colsAfter);
  });
})();