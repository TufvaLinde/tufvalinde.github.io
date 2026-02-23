(async () => {
  const viewport = document.getElementById("logViewport");
  const grid = document.getElementById("logGrid");
  if (!viewport || !grid) return;

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
      timeline.push({ type: "month", label: months[m0] });
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
  let previewLevel = 1;
  let previewCell = levels[committedLevel].cell;

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function colsForCell(cellPx) {
    return Math.max(1, Math.floor(viewport.clientWidth / cellPx));
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

  const textNodes = new Array(timeline.length);

  function buildGridOnce() {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];

      const cell = document.createElement("div");
      cell.className = "logCell";

      const inner = document.createElement("div");
      inner.className = "logInner";

      const text = document.createElement("div");
      text.className = "logText";

      if (entry.type === "month") cell.classList.add("monthCell");

      inner.appendChild(text);
      cell.appendChild(inner);
      frag.appendChild(cell);

      textNodes[i] = text;
    }

    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  function stripHtml(s) {
    return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function applyMode(levelIdx) {
    const mode = levels[levelIdx].mode;

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];
      const text = textNodes[i];

      if (entry.type === "month") {
        text.textContent = entry.label;
        continue;
      }

      const arr = byDay.get(entry.key);

      if (mode === "mark") {
        text.textContent = arr && arr.length ? "•" : "";
        continue;
      }

      if (mode === "date") {
        text.textContent = String(entry.d);
        continue;
      }

      if (mode === "time") {
        text.textContent = arr && arr.length ? arr[0].ts_display.slice(9) : String(entry.d);
        continue;
      }

      if (mode === "text") {
        if (arr && arr.length) {
          const t = arr[0].ts_display;
          const s = stripHtml(arr[0].html);
          text.textContent = s ? `${t} ${s}` : t;
        } else {
          text.textContent = String(entry.d);
        }
        continue;
      }
    }
  }

  function applyPreview(cellPx) {
    previewCell = cellPx;

    const nextPreviewLevel = closestLevelFromCell(previewCell);
    if (nextPreviewLevel !== previewLevel) {
      previewLevel = nextPreviewLevel;
      applyMode(previewLevel);
    }

    setVars(previewCell, levels[previewLevel]);
  }

  function commitSnap(cellPxBefore, colsBefore, idx) {
    committedLevel = previewLevel;
    previewCell = levels[committedLevel].cell;

    const colsAfter = setVars(previewCell, levels[committedLevel]);
    applyMode(committedLevel);
    scrollToAnchor(idx, previewCell, colsAfter);
  }

  function init() {
    buildGridOnce();
    setVars(previewCell, levels[committedLevel]);
    applyMode(committedLevel);

    const cols = colsForCell(previewCell);
    const targetIdx = timeline.findIndex(x => x.type === "day" && x.key === maxKey);
    if (targetIdx >= 0) scrollToAnchor(targetIdx, previewCell, cols);
  }

  init();

  let wheelSnapT = null;

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const cellBefore = previewCell;
    const colsBefore = colsForCell(cellBefore);
    const idx = anchorIndex(cellBefore, colsBefore);

    const k = Math.exp(-e.deltaY * 0.002);
    const next = clamp(previewCell * k, levels[0].cell, levels[levels.length - 1].cell);
    applyPreview(next);

    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(() => {
      commitSnap(cellBefore, colsBefore, idx);
    }, 120);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartCell = null;
  let gestureAnchor = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartCell = previewCell;

    const colsBefore = colsForCell(previewCell);
    gestureAnchor = {
      cellBefore: previewCell,
      colsBefore,
      idx: anchorIndex(previewCell, colsBefore)
    };
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const ratio = e.scale / gestureStartScale;
    const next = clamp(gestureStartCell * ratio, levels[0].cell, levels[levels.length - 1].cell);
    applyPreview(next);

    const colsAfter = colsForCell(previewCell);
    scrollToAnchor(gestureAnchor.idx, previewCell, colsAfter);
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const a = gestureAnchor;

    gestureStartScale = null;
    gestureStartCell = null;
    gestureAnchor = null;

    commitSnap(a.cellBefore, a.colsBefore, a.idx);
  }, { passive: false });

  window.addEventListener("resize", () => {
    const cellBefore = previewCell;
    const colsBefore = colsForCell(cellBefore);
    const idx = anchorIndex(cellBefore, colsBefore);

    setVars(previewCell, levels[previewLevel]);
    scrollToAnchor(idx, previewCell, colsForCell(previewCell));
  });
})();