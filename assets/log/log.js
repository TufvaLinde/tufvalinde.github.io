(async () => {
  const viewport = document.getElementById("logViewport");
  const stage = document.getElementById("logStage");
  const grid = document.getElementById("logGrid");

  const overlay = document.createElement("div");
  overlay.id = "logOverlay";
  overlay.innerHTML = `<div id="logOverlayHeader"></div><div id="logOverlayBody"></div>`;
  stage.appendChild(overlay);

  const overlayHeader = overlay.querySelector("#logOverlayHeader");
  const overlayBody = overlay.querySelector("#logOverlayBody");

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    grid.textContent = `Could not load logs.json (${res.status})`;
    return;
  }
  const items = await res.json();

  const byDay = new Map();
  let minDay = null;
  let maxDay = null;

  for (const it of items) {
    const iso = it.ts_iso;
    const d = new Date(iso);
    const dayKey = d.toISOString().slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(it);

    if (!minDay || dayKey < minDay) minDay = dayKey;
    if (!maxDay || dayKey > maxDay) maxDay = dayKey;
  }

  for (const [k, arr] of byDay.entries()) {
    arr.sort((a, b) => (a.ts_iso < b.ts_iso ? -1 : 1));
  }

  function parseDayKey(k) {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function dayKeyFromDateUTC(dt) {
    return dt.toISOString().slice(0, 10);
  }

  function addDaysUTC(dt, n) {
    const x = new Date(dt.getTime());
    x.setUTCDate(x.getUTCDate() + n);
    return x;
  }

  function startOfWeekUTC(dt) {
    const day = dt.getUTCDay();
    const diff = (day + 6) % 7;
    return addDaysUTC(dt, -diff);
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  const levels = [
    { id: "year",  cell: 6,  gap: 1, pad: 6,  inpad: 0, font: 0,  mark: 5,  mode: "mark" },
    { id: "month", cell: 12, gap: 1, pad: 8,  inpad: 1, font: 0,  mark: 8,  mode: "count" },
    { id: "week",  cell: 24, gap: 2, pad: 10, inpad: 2, font: 10, mark: 10, mode: "time" },
    { id: "day",   cell: 52, gap: 3, pad: 12, inpad: 4, font: 13, mark: 12, mode: "title" }
  ];

  let committedLevel = 1;
  let previewScale = 1;
  let baseScale = 1;
  let rafPending = false;

  function setCSSVars(lvl) {
    grid.style.setProperty("--cell", `${lvl.cell}px`);
    grid.style.setProperty("--gap", `${lvl.gap}px`);
    grid.style.setProperty("--pad", `${lvl.pad}px`);
    grid.style.setProperty("--inpad", `${lvl.inpad}px`);
    grid.style.setProperty("--font", `${lvl.font}px`);
    grid.style.setProperty("--mark", `${lvl.mark}px`);
  }

  function applyTransform(scale, animate) {
    stage.style.transition = animate ? "transform 180ms cubic-bezier(.2,.8,.2,1)" : "none";
    stage.style.transform = `scale(${scale})`;
  }

  function requestApply() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      applyTransform(baseScale * previewScale, false);
    });
  }

  function closestLevelFromEffectiveCell(effectiveCellPx) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < levels.length; i++) {
      const d = Math.abs(levels[i].cell - effectiveCellPx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function commitSnap() {
    const current = levels[committedLevel];
    const effectiveCell = current.cell * previewScale;
    const nextLevel = closestLevelFromEffectiveCell(effectiveCell);
    committedLevel = nextLevel;

    setCSSVars(levels[committedLevel]);

    previewScale = 1;
    applyTransform(baseScale, true);

    renderTexts();
  }

  const marginDays = 21;
  const minDate = startOfWeekUTC(addDaysUTC(parseDayKey(minDay), -marginDays));
  const maxDate = addDaysUTC(parseDayKey(maxDay), marginDays);
  const endDate = addDaysUTC(startOfWeekUTC(addDaysUTC(maxDate, 6)), 6);

  const days = [];
  for (let d = new Date(minDate.getTime()); d <= endDate; d = addDaysUTC(d, 1)) {
    days.push(new Date(d.getTime()));
  }

  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const d of days) {
    const key = dayKeyFromDateUTC(d);
    const cell = document.createElement("div");
    cell.className = "logCell";

    const inner = document.createElement("div");
    inner.className = "logCellInner";

    const mark = document.createElement("div");
    mark.className = "logCellMark";

    const text = document.createElement("div");
    text.className = "logCellText";

    inner.appendChild(mark);
    inner.appendChild(text);
    cell.appendChild(inner);

    const entries = byDay.get(key);
    if (entries && entries.length) {
      cell.classList.add("logCellHas");
      cell.dataset.day = key;
      cell.dataset.count = String(entries.length);
    } else {
      cell.classList.add("logCellEmpty");
    }

    cell.dataset.key = key;

    cell.addEventListener("click", () => {
      const k = cell.dataset.key;
      const arr = byDay.get(k);
      if (!arr || !arr.length) {
        overlay.classList.remove("open");
        return;
      }
      overlay.classList.add("open");
      overlayHeader.textContent = k;
      overlayBody.innerHTML = arr.map(x => {
        const t = x.ts_display ? x.ts_display : "";
        const title = x.title ? ` -- ${x.title}` : "";
        return `<div style="margin-bottom:10px"><div style="opacity:.75;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:12px">${t}${title}</div>${x.html}</div>`;
      }).join("");
    });

    frag.appendChild(cell);
  }

  grid.appendChild(frag);

  function renderTexts() {
    const lvl = levels[committedLevel];
    const cells = grid.querySelectorAll(".logCell");
    for (const cell of cells) {
      const inner = cell.firstChild;
      const mark = inner.children[0];
      const text = inner.children[1];

      const key = cell.dataset.key;
      const entries = byDay.get(key);

      mark.textContent = "";
      text.textContent = "";

      if (!entries || !entries.length) {
        if (lvl.id === "day") {
          text.textContent = key.slice(8, 10);
        }
        continue;
      }

      if (lvl.mode === "mark") {
        mark.textContent = "•";
        continue;
      }

      if (lvl.mode === "count") {
        mark.textContent = entries.length > 1 ? String(entries.length) : "•";
        continue;
      }

      if (lvl.mode === "time") {
        const first = entries[0];
        mark.textContent = entries.length > 1 ? String(entries.length) : "•";
        text.textContent = first.ts_display ? first.ts_display.slice(9) : "";
        continue;
      }

      if (lvl.mode === "title") {
        const first = entries[0];
        mark.textContent = entries.length > 1 ? String(entries.length) : "•";
        text.textContent = first.title ? first.title : (first.ts_display ? first.ts_display : "");
        continue;
      }
    }
  }

  setCSSVars(levels[committedLevel]);
  applyTransform(baseScale, false);
  renderTexts();

  const pointers = new Map();
  let pinchStart = null;
  let wheelSnapT = null;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  viewport.addEventListener("pointerdown", (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p1, p2] = Array.from(pointers.values());
      pinchStart = { d: dist(p1, p2), scale: previewScale };
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchStart) {
      const [p1, p2] = Array.from(pointers.values());
      const ratio = dist(p1, p2) / pinchStart.d;
      previewScale = clamp(pinchStart.scale * ratio, 0.35, 5);
      requestApply();
    }
  });

  function endPinch() {
    if (pinchStart) commitSnap();
    pinchStart = null;
    pointers.clear();
  }

  viewport.addEventListener("pointerup", endPinch);
  viewport.addEventListener("pointercancel", endPinch);

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const k = Math.exp(-e.deltaY * 0.002);
    previewScale = clamp(previewScale * k, 0.35, 5);
    requestApply();
    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(commitSnap, 120);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartPreview = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartPreview = previewScale;
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    const ratio = e.scale / gestureStartScale;
    previewScale = clamp(gestureStartPreview * ratio, 0.35, 5);
    requestApply();
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    gestureStartScale = null;
    gestureStartPreview = null;
    commitSnap();
  }, { passive: false });
})();