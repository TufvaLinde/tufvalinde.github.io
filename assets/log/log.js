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
    { cols: 5, mode: "mark", font: 12, pad: 3, square: true },
    { cols: 7, mode: "mark", font: 12, pad: 2, square: true }
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
      if (entry.type === "month") {
        cell.classList.add("monthCell", "is-month");
      }

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
      const cell = cellEls[i];

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
        if (!has) {
          text.textContent = "";
        } else {
          text.textContent = arr.length === 1 ? "•" : String(arr.length);
        }
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
    const t = clamp(zVal, 0, 3);
    return Math.round(t);
  }

  function cellHeightEstimate() {
    const first = grid.querySelector(".logCell");
    return first ? first.getBoundingClientRect().height : 1;
  }

  function anchorIndex(cols) {
    const h = cellHeightEstimate();
    const row = Math.floor(viewport.scrollTop / Math.max(1, h));
    const idx = row * cols;
    return clamp(idx, 0, timeline.length - 1);
  }

  function scrollToAnchor(idx, cols) {
    const h = cellHeightEstimate();
    const row = Math.floor(idx / cols);
    viewport.scrollTop = row * h;
  }

  function setPreviewLevelFromZ(keepAnchor) {
    const next = nearestLevelIndexFromZ(z);

    const colsBefore = levels[previewLevel].cols;
    const idx = keepAnchor ? anchorIndex(colsBefore) : null;

    if (next !== previewLevel) {
      previewLevel = next;
      applyLayout(previewLevel);
    }

    if (keepAnchor && idx != null) {
      const colsAfter = levels[previewLevel].cols;
      scrollToAnchor(idx, colsAfter);
    }
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  let snapAnim = null;

  function startSnapAnimation() {
    const target = previewLevel;
    const start = z;
    const end = target;

    const colsBefore = levels[previewLevel].cols;
    const idx = anchorIndex(colsBefore);

    snapAnim = {
      t0: performance.now(),
      dur: 220,
      start,
      end,
      idx
    };

    const step = (now) => {
      if (!snapAnim) return;
      const t = clamp((now - snapAnim.t0) / snapAnim.dur, 0, 1);
      const e = easeOutBack(t);
      z = snapAnim.start + (snapAnim.end - snapAnim.start) * e;
      setPreviewLevelFromZ(true);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        z = end;
        committedLevel = target;
        previewLevel = target;
        applyLayout(committedLevel);
        scrollToAnchor(snapAnim.idx, levels[committedLevel].cols);
        snapAnim = null;
      }
    };

    requestAnimationFrame(step);
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

    const factor = Math.exp(-e.deltaY * 0.003);
    const dz = -Math.log2(factor) * 1.1;
    z = clamp(z + dz, 0, 3);
    setPreviewLevelFromZ(true);

    clearTimeout(wheelSnapT);
    wheelSnapT = setTimeout(() => {
      if (snapAnim) snapAnim = null;
      startSnapAnimation();
    }, 120);
  }, { passive: false });

  let gestureStartScale = null;
  let gestureStartZ = null;

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureStartScale = e.scale;
    gestureStartZ = z;
    if (snapAnim) snapAnim = null;
  }, { passive: false });

  viewport.addEventListener("gesturechange", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    const ratio = e.scale / gestureStartScale;
    const dz = -Math.log2(ratio) * 1.6;
    z = clamp(gestureStartZ + dz, 0, 3);
    setPreviewLevelFromZ(true);
  }, { passive: false });

  viewport.addEventListener("gestureend", (e) => {
    if (gestureStartScale == null) return;
    e.preventDefault();

    gestureStartScale = null;
    gestureStartZ = null;

    startSnapAnimation();
  }, { passive: false });

  window.addEventListener("resize", () => {
    applyLayout(committedLevel);
  });
})();