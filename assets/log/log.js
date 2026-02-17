(async () => {
  const grid = document.getElementById("logGrid");
  grid.textContent = "Loading logs…";

  const res = await fetch("/assets/log/logs.json", { cache: "no-store" });
  if (!res.ok) {
    grid.textContent = `Could not load logs.json (${res.status})`;
    return;
  }

  const items = await res.json();
  if (!items.length) {
    grid.textContent = "No logs found.";
    return;
  }

  grid.innerHTML = "";

  for (const it of items) {
    const card = document.createElement("div");
    card.className = "logCard";

    const h = document.createElement("div");
    h.className = "logCardHeader";
    h.textContent = `${it.ts_display}${it.title ? " -- " + it.title : ""}`;

    const body = document.createElement("div");
    body.className = "logCardBody";
    body.innerHTML = it.html;

    card.appendChild(h);
    card.appendChild(body);
    grid.appendChild(card);
  }
})();