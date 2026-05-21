(function() {


  if (typeof L === "undefined") {
    console.error("Leaflet not loaded!");
    return;
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const n = text[i + 1];

      if (c === '"' && quoted && n === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = !quoted;
      } else if (c === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (cell || row.length) {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        }
        if (c === "\r" && n === "\n") i++;
      } else {
        cell += c;
      }
    }

    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }

    const headers = rows.shift();
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  }

  function parseCoord(s) {
    const m = String(s).trim().match(/^(\d+)°(\d+(?:\.\d+)?)'([NSEW])$/);
    if (!m) return null;

    let v = Number(m[1]) + Number(m[2]) / 60;
    if (m[3] === "S" || m[3] === "W") v *= -1;
    return v;
  }

  function formatTimestamp(dateStr, timeStr) {
    const [d, m] = dateStr.split("/").map(Number);

    const year = 2026;

    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");

    return `${year}-${mm}-${dd}T${timeStr}UTC`;
  }

  function renderPanel(panel, row) {
    panel.innerHTML = `
      <h2 class="passage-timestamp">
        ${formatTimestamp(row.date, row.time)}
      </h2>
      <dl>
        <dt>log</dt><dd>${row.log || "-"}nm</dd>
        <dt>sog</dt><dd>${row.sog || "-"}kts</dd>
        <dt>cog</dt><dd>${row.cog || "-"}°</dd>

      </dl>
      ${row.observation ? `<p class="observation">${row.observation}</p>` : ""}
    `;
  }

  function markerStyle(active) {
    return {
      radius: active ? 8 : 4,
      weight: active ? 3 : 1,
      opacity: 1,
      color: 'black',
      fillOpacity: active ? 1 : 0.75
    };
  }

  document.querySelectorAll(".passage-map").forEach(async (el) => {
    const csvUrl = el.dataset.csv || "/assets/passagemap/logbookdata.csv";
    const panel = document.getElementById("passage-log-panel");

    const shell = el.closest(".passage-map-shell");
    const connector = shell.querySelector("#passage-connector-line");

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true
    }).setView([29.68864, -36.74053], 3);

    L.tileLayer(
      "https://api.maptiler.com/maps/ocean/{z}/{x}/{y}.png?key=Bwul8Qh1O2hfS4FXaO5d",
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '&copy; MapTiler'
      }
    ).addTo(map);

    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();
    const rows = parseCSV(text);

    const entries = rows
      .map(row => {
        const lat = parseCoord(row.lat);
        const lon = parseCoord(row.lon);
        return { row, lat, lon, marker: null };
      })
      .filter(p => p.lat != null && p.lon != null);

    const points = entries.map(p => [p.lat, p.lon]);

    if (!points.length) {
      console.error("No valid coordinates found");
      return;
    }

    L.polyline(points, {
      weight: 3,
      color: 'black'
    }).addTo(map);

    let selected = entries[entries.length - 1];

    function selectEntry(entry) {
      selected = entry;

      entries.forEach(e => {
        if (!e.marker) return;
        e.marker.setStyle(markerStyle(e === selected));
      });

      renderPanel(panel, entry.row);
      entry.marker.bringToFront();
      requestAnimationFrame(updateConnector);
    }

    function updateConnector() {
      if (!selected || !connector || !panel) return;
      const markerLatLng = L.latLng(selected.lat, selected.lon);
      if (!map.getBounds().contains(markerLatLng)) {
        connector.style.opacity = "0";
        return;
      }
      connector.style.opacity = "1";

      const shellRect = shell.getBoundingClientRect();
      const panelHeading = panel.querySelector("h2");
      if (!panelHeading) return;

      const p = map.latLngToContainerPoint([selected.lat, selected.lon]);
      const mapRect = el.getBoundingClientRect();
      const headingRect = panelHeading.getBoundingClientRect();

      const x1 = mapRect.left - shellRect.left + p.x;
      const y1 = mapRect.top - shellRect.top + p.y;

      const mobile = window.innerWidth < 800;

      const x2 = mobile
        ? headingRect.right - shellRect.left
        : headingRect.left - shellRect.left;
      const y2 = headingRect.bottom - shellRect.top;

      connector.setAttribute("x1", x1);
      connector.setAttribute("y1", y1);
      connector.setAttribute("x2", x2);
      connector.setAttribute("y2", y2);
    }

    entries.forEach(entry => {
      entry.marker = L.circleMarker([entry.lat, entry.lon], markerStyle(false))
        .addTo(map)
        .on("click", () => selectEntry(entry));
    });

    selectEntry(selected);

    const recentPoints = points.slice(-12);

    map.fitBounds(recentPoints, {
      padding: [40, 40],
      maxZoom: 7
    });
    updateConnector();
    map.on("move zoom resize moveend zoomend", updateConnector);
    window.addEventListener("resize", updateConnector);
  });
})();