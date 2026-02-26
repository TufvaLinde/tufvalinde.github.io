(async () => {
  const viewport = document.getElementById("logViewport");
  const stream = document.getElementById("logStream");
  if (!viewport || !stream) return;

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    stream.textContent = `Could not load logs.json (${res.status})`;
    return;
  }
  const items = await res.json();

  const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const weekdayLabelsMon = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const weekStart = 1;

  function dayKeyLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function stripHtml(s) {
    return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  const byDay = new Map();
  let minDayKey = null;

  for (const it of items) {
    const d = new Date(it.ts_iso);
    const k = dayKeyLocal(d);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(it);
    if (!minDayKey || k < minDayKey) minDayKey = k;
  }

  for (const [k, arr] of byDay.entries()) {
    arr.sort((a, b) => (a.ts_iso < b.ts_iso ? -1 : 1));
  }

  function parseDayKeyLocal(k) {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function monthKey(y, m0) {
    return `${y}-${String(m0 + 1).padStart(2, "0")}`;
  }

  function addMonths(y, m0, delta) {
    const dt = new Date(y, m0 + delta, 1);
    return { y: dt.getFullYear(), m0: dt.getMonth() };
  }

  function daysInMonth(y, m0) {
    return new Date(y, m0 + 1, 0).getDate();
  }

  function weekdayIndex(d) {
    const w = d.getDay();
    if (weekStart === 1) return (w + 6) % 7;
    return w;
  }

  const today = new Date();
  const todayKey = dayKeyLocal(today);

  const earliest = parseDayKeyLocal(minDayKey);
  const earliestY = earliest.getFullYear();
  const earliestM0 = earliest.getMonth();

  let y = today.getFullYear();
  let m0 = today.getMonth();

  stream.innerHTML = "";

  while (y > earliestY || (y === earliestY && m0 >= earliestM0)) {
    const monthEl = document.createElement("section");
    monthEl.className = "month";

    const header = document.createElement("div");
    header.className = "monthHeader";

    const title = document.createElement("div");
    title.className = "monthTitle";
    title.textContent = `${monthNames[m0]} ${y}`;

    header.appendChild(title);

    const weekdays = document.createElement("div");
    weekdays.className = "weekdays";
    for (const w of weekdayLabelsMon) {
      const el = document.createElement("div");
      el.className = "weekday";
      el.textContent = w;
      weekdays.appendChild(el);
    }

    const grid = document.createElement("div");
    grid.className = "grid";

    const first = new Date(y, m0, 1);
const startOffset = weekdayIndex(first);
const nDays = daysInMonth(y, m0);
header.style.display = startOffset >= 2 ? "none" : "block";

const isCurrentMonth = (y === today.getFullYear() && m0 === today.getMonth());
const limitDay = isCurrentMonth ? today.getDate() : nDays;

const visibleDaysCount = startOffset + limitDay;
const totalCells = Math.ceil(visibleDaysCount / 7) * 7;

grid.innerHTML = "";

if (startOffset >= 2) {
  const label = document.createElement("div");
  label.className = "monthLabelInGrid";
  label.style.gridColumn = `1 / span ${startOffset}`;
  label.style.gridRow = "1";
  const t = document.createElement("span");
  t.textContent = `${monthNames[m0]} ${String(y).slice(2)}`;
  label.appendChild(t);
  grid.appendChild(label);
}

for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";

  const inner = document.createElement("div");
  inner.className = "cellInner";

  const dayNum = document.createElement("div");
  dayNum.className = "dayNum";

  const logs = document.createElement("div");
  logs.className = "logs";

  const dayIndex = i - startOffset + 1;

  const isOutsideMonth = (dayIndex < 1 || dayIndex > nDays);
  const isFutureInCurrentMonth = isCurrentMonth && dayIndex > limitDay;

  if (isOutsideMonth || isFutureInCurrentMonth) {
    cell.classList.add("is-outside");
    dayNum.textContent = "";
    logs.textContent = "";
  } else {
    const d = new Date(y, m0, dayIndex);
    const k = dayKeyLocal(d);

    dayNum.textContent = String(dayIndex);

    const arr = byDay.get(k);
    if (!arr || !arr.length) {
      cell.classList.add("is-empty");
      logs.textContent = "";
    } else {
      const lines = [];
      const n = Math.min(arr.length, 20);
      for (let j = 0; j < n; j++) {
        const t = arr[j].ts_display;
        const s = stripHtml(arr[j].html);
        lines.push(s ? `${t} ${s}` : t);
      }
      if (arr.length > n) lines.push("…");
      logs.textContent = lines.join("\n");
    }
  }

  inner.appendChild(dayNum);
  inner.appendChild(logs);
  cell.appendChild(inner);
  grid.appendChild(cell);
}

    monthEl.appendChild(header);
    monthEl.appendChild(weekdays);
    monthEl.appendChild(grid);

    stream.appendChild(monthEl);

    const prev = addMonths(y, m0, -1);
    y = prev.y;
    m0 = prev.m0;
  }

  viewport.scrollTop = 0;
})();