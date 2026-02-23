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

  function stripHtml(s) {
    return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
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
    { cols: 1, mode: "text", font: 14, pad: 8, square: false },
    { cols: 2, mode: "text", font: 12, pad: 6, square: false },
    { cols: 5, mode: "mark", font: 10, pad: 3, square: true },
    { cols: 7, mode: "mark", font: 10, pad: 2, square: true }
  ];

  let committedLevel = 1;
  let previewLevel = 1;
  let z = committedLevel;

  const textNodes = new Array(timeline.length);
  const cellEls = new Array(timeline.length);

  function buildGridOnce() {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];

      const cell = document.createElement("div");
      cell.className = "logCell";
      if (entry.type === "month") cell.classList.add("monthCell");

      const inner = document.createElement("div");
      inner.className = "logInner";

      const text = document.createElement("div");
      text.className = "logText";

      inner.appendChild(text);
      cell.appendChild(inner);
      frag.appendChild(cell);

      textNodes[i] = text;
      cellEls[i] = cell;
    }

    grid.innerHTML = "";
    grid.appendChild(frag);
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

      if (mode === "text") {
        if (arr && arr.length) {
          const first = arr[0];
          const t = first.ts_display;
          const s = stripHtml(first.html);
          text.textContent = s ? `${t} ${s}` : t;
        } else {
          text.textContent = String(entry.d);
        }
        continue;
      }
    }
  }

  function applyLayout(levelIdx) {
    const lvl = levels[levelIdx];
    grid.style.setProperty("--cols", String(lvl.cols));
    grid.style.setProperty("--font", `${lvl.font}px`);
    grid.style.setProperty("--pad", `${lvl.pad}px`);

    if (lvl.square) grid.classList.add("is-square");
    else grid.classList.remove("is-square");

    applyMode(levelIdx);
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function nearestLevelIndexFromZ(zVal) {
    const allowed = [0, 1, 2, 3];
    let best = 0;
    let bestDist = Infinity;
    for (const i of allowed) {
      const d = Math.abs(i - zVal);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function anchorIndex(cols) {
    const firstVisible = Math.floor(viewport.scrollTop / 1);
    const approxRow = Math.floor(firstVisible / 1);
    const row = Math.floor(viewport.scrollTop / (grid.firstElementChild ? grid.firstElementChild.getBoundingClientRect().height : 1));
    const idx = row * cols;
    return clamp(idx, 0, timeline.length - 1);
  }

  function scrollToAnchor(idx, cols) {
    const row = Math.floor(idx / cols);
    const firstCell = grid.querySelector(".logCell");
    const h = firstCell ? firstCell.getBoundingClientRect().height : 1;
    viewport.scrollTop = row * h;
  }

  function setPreviewZ(nextZ, keepAnchor) {
    z = clamp(nextZ, 0, 3);
    const nextPreviewLevel = nearestLevelIndexFromZ(z);

    const colsBefore = levels[previewLevel].cols;
    const idx = keepAnchor ? anchorIndex(colsBefore) : null;

    if (nextPreviewLevel !== previewLevel) {
      previewLevel = nextPreviewLevel;
      applyLayout(previewLevel);
    }

    if (keepAnchor && idx != null) {
      const colsAfter = levels[previewLevel].cols;
      scrollToAnchor(idx, colsAfter);
    }
  }

  function commitSnap() {
    committedLevel = previewLevel;
    z = committedLevel;
    applyLayout(committedLevel);
  }

  function init() {
    buildGridOnce();
    applyLayout(committedLevel);

    const targetIdx = timeline.findIndex(x => x.type === "day" && x.key === maxKey);
    if (targetIdx >= 0) {
      scrollToAnchor(targetIdx, levels[committedLevel].cols);
    }
  }

  init();

  let wheelSnapT = null;

  viewport.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const k = Math.exp(-e.deltaY * 0.003);
    const dz = (k - 1) * 1.25;
    setPreviewZ(z + dz, true);

    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(commitSnap, 140);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartZ = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartZ = z;
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    const ratio = e.scale / gestureStartScale;
    const dz = Math.log2(ratio) * 1.4;
    setPreviewZ(gestureStartZ + dz, true);
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();
    gestureStartScale = null;
    gestureStartZ = null;
    commitSnap();
  }, { passive: false });

  window.addEventListener("resize", () => {
    applyLayout(committedLevel);
  });
})();