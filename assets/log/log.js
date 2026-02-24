(async () => {
  const viewport = document.getElementById("logViewport");
  const gridA = document.getElementById("logGrid");
  if (!viewport || !gridA) return;

  const gridB = document.createElement("div");
  gridB.id = "logGrid2";
  viewport.appendChild(gridB);

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    gridA.textContent = `Could not load logs.json (${res.status})`;
    return;
  }
  const items = await res.json();

  function dayKeyLocalFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  const byDay = new Map();
  let minKey = null;

  for (const it of items) {
    const d = new Date(it.ts_iso);
    const key = dayKeyLocalFromDate(d);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(it);
    if (!minKey || key < minKey) minKey = key;
  }

  for (const [k, arr] of byDay.entries()) {
    arr.sort((a, b) => (a.ts_iso < b.ts_iso ? -1 : 1));
  }

  function parseDayKeyLocal(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDaysLocal(dt, n) {
    const x = new Date(dt.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function stripHtml(s) {
    return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  const today = new Date();
  const startDate = parseDayKeyLocal(dayKeyLocalFromDate(today));
  const endDate = parseDayKeyLocal(minKey);

  const timeline = [];
  let cursor = new Date(startDate.getTime());
  let lastMonth = null;

  while (cursor >= endDate) {
    const m0 = cursor.getMonth();
    const mk = `${cursor.getFullYear()}-${m0}`;
    if (mk !== lastMonth) {
      timeline.push({ type: "month", label: months[m0] });
      lastMonth = mk;
    }
    timeline.push({ type: "day", key: dayKeyLocalFromDate(cursor), d: cursor.getDate() });
    cursor = addDaysLocal(cursor, -1);
  }

  const levels = [
    { cols: 1, mode: "text", font: 14, pad: 8, square: false },
    { cols: 2, mode: "text", font: 12, pad: 6, square: false },
    { cols: 5, mode: "mark", font: 12, pad: 3, square: true },
    { cols: 7, mode: "mark", font: 12, pad: 2, square: true }
  ];

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function nearestLevelFromZ(zVal) {
    return Math.round(clamp(zVal, 0, 3));
  }

  function applyLayoutVars(grid, levelIdx) {
    const lvl = levels[levelIdx];
    grid.style.setProperty("--cols", String(lvl.cols));
    grid.style.setProperty("--font", `${lvl.font}px`);
    grid.style.setProperty("--pad", `${lvl.pad}px`);
    if (lvl.square) grid.classList.add("is-square");
    else grid.classList.remove("is-square");
  }

  function buildGridDOM(grid) {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];

      const cell = document.createElement("div");
      cell.className = "logCell";
      if (entry.type === "month") cell.classList.add("monthCell", "is-month");

      const inner = document.createElement("div");
      inner.className = "logInner";

      const text = document.createElement("div");
      text.className = "logText";

      inner.appendChild(text);
      cell.appendChild(inner);
      frag.appendChild(cell);
    }

    grid.innerHTML = "";
    grid.appendChild(frag);
  }

  function fillGridText(grid, levelIdx) {
    const mode = levels[levelIdx].mode;
    const cells = grid.children;

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];
      const cell = cells[i];
      const text = cell.firstChild.firstChild;

      cell.classList.remove("has-log", "is-empty", "is-dayno", "multi");

      if (entry.type === "month") {
        text.textContent = entry.label;
        continue;
      }

      const arr = byDay.get(entry.key);
      const has = !!(arr && arr.length);

      if (!has) cell.classList.add("is-empty");
      if (has) cell.classList.add("has-log");
      if (has && arr.length > 1) cell.classList.add("multi");

      if (mode === "mark") {
        if (!has) text.textContent = "";
        else text.textContent = arr.length === 1 ? "•" : String(arr.length);
        continue;
      }

      if (mode === "text") {
        if (!has) {
          cell.classList.add("is-dayno");
          text.textContent = String(entry.d);
        } else {
          const lines = [];
          const n = Math.min(arr.length, 12);
          for (let j = 0; j < n; j++) {
            const t = arr[j].ts_display;
            const s = stripHtml(arr[j].html);
            lines.push(s ? `${t} ${s}` : t);
          }
          if (arr.length > n) lines.push("…");
          text.textContent = lines.join("\n");
        }
        continue;
      }
    }
  }

  function renderGrid(grid, levelIdx) {
    applyLayoutVars(grid, levelIdx);
    if (!grid.children.length) buildGridDOM(grid);
    fillGridText(grid, levelIdx);
  }

  let activeGrid = gridA;
  let inactiveGrid = gridB;

  let committedLevel = 1;
  let previewZ = committedLevel;
  let previewLevel = committedLevel;

  renderGrid(activeGrid, committedLevel);
  renderGrid(inactiveGrid, committedLevel);

  viewport.scrollTop = 0;

  function swapGrids() {
    const tmp = activeGrid;
    activeGrid = inactiveGrid;
    inactiveGrid = tmp;
  }

  function setGestureTransform(scale) {
    activeGrid.style.transformOrigin = "50% 25%";
    activeGrid.style.transform = `scale(${scale})`;
    activeGrid.style.filter = "none";
  }

  function clearGestureTransform() {
    activeGrid.style.transform = "none";
    activeGrid.style.filter = "none";
  }

  function crossfadeToLevel(targetLevel, direction) {
    viewport.classList.add("is-layer-animating");

    renderGrid(inactiveGrid, targetLevel);

    inactiveGrid.style.opacity = "0";
    inactiveGrid.style.transformOrigin = "50% 25%";
    inactiveGrid.style.filter = "blur(2px)";

    const outScale = direction > 0 ? 0.92 : 1.08;
    const inScale = direction > 0 ? 1.06 : 0.96;

    activeGrid.style.opacity = "1";
    activeGrid.style.transform = `scale(${outScale})`;
    activeGrid.style.filter = "blur(2px)";

    inactiveGrid.style.transform = `scale(${inScale})`;

    requestAnimationFrame(() => {
      inactiveGrid.style.opacity = "1";
      inactiveGrid.style.transform = "scale(1)";
      inactiveGrid.style.filter = "none";

      activeGrid.style.opacity = "0";
    });

    setTimeout(() => {
      swapGrids();

      inactiveGrid.style.opacity = "0";
      inactiveGrid.style.transform = "none";
      inactiveGrid.style.filter = "none";

      activeGrid.style.opacity = "1";
      activeGrid.style.transform = "none";
      activeGrid.style.filter = "none";

      viewport.classList.remove("is-layer-animating");
    }, 240);
  }

  let gestureStartScale = null;
  let gestureStartZ = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartZ = previewZ;
    clearGestureTransform();
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const ratio = e.scale / gestureStartScale;

    const dz = -Math.log2(ratio) * 1.6;
    previewZ = clamp(gestureStartZ + dz, 0, 3);

    const nextPreviewLevel = nearestLevelFromZ(previewZ);
    if (nextPreviewLevel !== previewLevel) {
      previewLevel = nextPreviewLevel;
      renderGrid(activeGrid, previewLevel);
    }

    const visualScale = clamp(ratio, 0.85, 1.15);
    setGestureTransform(visualScale);
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const startLevel = committedLevel;
    const targetLevel = previewLevel;
    const direction = targetLevel > startLevel ? 1 : -1;

    clearGestureTransform();
    committedLevel = targetLevel;
    previewZ = committedLevel;

    crossfadeToLevel(committedLevel, direction);

    gestureStartScale = null;
    gestureStartZ = null;
  }, { passive: false });

  let wheelSnapT = null;
  let wheelLastZ = previewZ;

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const factor = Math.exp(-e.deltaY * 0.003);
    const dz = -Math.log2(factor) * 1.1;

    wheelLastZ = previewZ;
    previewZ = clamp(previewZ + dz, 0, 3);

    const nextPreviewLevel = nearestLevelFromZ(previewZ);
    if (nextPreviewLevel !== previewLevel) {
      previewLevel = nextPreviewLevel;
      renderGrid(activeGrid, previewLevel);
    }

    const scale = dz > 0 ? 0.96 : 1.04;
    setGestureTransform(scale);
    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(() => {
      const startLevel = committedLevel;
      const targetLevel = previewLevel;
      const direction = targetLevel > startLevel ? 1 : -1;

      clearGestureTransform();
      committedLevel = targetLevel;
      previewZ = committedLevel;

      crossfadeToLevel(committedLevel, direction);
    }, 140);
  }, { passive: false });

  window.addEventListener("resize", () => {
    renderGrid(activeGrid, committedLevel);
  });
})();