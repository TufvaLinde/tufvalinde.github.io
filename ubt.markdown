---
layout: default
title: UBT
permalink: /ultimate-beach-tour/
---

# ULTIMATE BEACH TOUR

<style>
  h1 {
    font-family: "Outfit", sans-serif;
    font-optical-sizing: auto;
    font-weight: 850;
    font-style: normal;
    word-spacing: 0.3em; 
    display: block;
    width: 100%;
    line-height: 1;
    margin: 0;
    text-align: center;   
  }

</style>

more to come on this page!

<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-curve"></script>

<div id="trip-map" style="height:600px; margin:1rem 0;"></div>

<script>
const people = [
  {% for p in site.ubtpeople %}
  {
    id: "{{ p.person_id | default: p.basename | strip }}",
    name: "{{ p.name | escape }}",
    color: "{{ p.color | escape }}",
    icon: "{{ p.icon | relative_url }}"
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];

const stops = [
  {% for n in site.ubtstops %}
    {% if n.lat and n.lon %}
    {
      title: "{{ n.title | escape }}",
      lat: {{ n.lat }},
      lon: {{ n.lon }},
      url: "{{ n.url | relative_url }}",
      dateStr: "{{ n.date | date: '%b %-d, %Y' }}",
      dateNum: {{ n.date | date: '%s' | plus: 0 }},
      popup: {{ n.popup | default: true | jsonify }},
      people: [{% if n.person %}{% if n.person.first %}{% for id in n.person %}"{{ id }}"{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}"{{ n.person | strip }}" {% endif %}{% endif %}]
    }{% unless forloop.last %},{% endunless %}
    {% endif %}
  {% endfor %}
];

const now = Math.floor(Date.now() / 1000);
stops.forEach(s => {
  s.future = s.dateNum > now;
  if (typeof s.popup === 'string') {
    s.popup = s.popup.toLowerCase() !== 'false';
  }
});

people.forEach(p => {
  const pastStops = stops.filter(s => s.people?.includes(p.id) && s.dateNum <= now);
  pastStops.sort((a, b) => b.dateNum - a.dateNum);
  p.currentStop = pastStops.length ? pastStops[0] : null;
});

const map = L.map('trip-map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.webp', {
  attribution: '&copy; OpenStreetMap & CartoCDN',
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

function makeCombinedFaceHTML(faces) {
  const size = 28;
  const overlap = 6;
  const cols = Math.ceil(Math.sqrt(faces.length));
  const rows = Math.ceil(faces.length / cols);
  const gridSize = size * cols - overlap * (cols - 1);
  let html = `<div style="position:relative;width:${gridSize}px;height:${gridSize}px;">`;
  faces.forEach((src, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    html += `<img src="${src}" style="
      width:${size}px;height:${size}px;border-radius:50%;
      position:absolute;left:${col * (size - overlap)}px;top:${row * (size - overlap)}px;
    ">`;
  });
  html += '</div>';
  return html;
}

// helper: curved trails
function curveBetween(a, b, amplitude = 0.2) {
  const latMid = (a[0] + b[0]) / 2;
  const lonMid = (a[1] + b[1]) / 2;
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const dist = Math.sqrt(dx*dx + dy*dy);
  const nx = -dy / dist, ny = dx / dist;
  const offset = amplitude * dist;
  const control1 = [latMid + ny * offset, lonMid + nx * offset];
  const control2 = [latMid - ny * offset / 2, lonMid - nx * offset / 2];
  return ['M', a, 'C', control1, control2, b];
}

function getSharedSegments(trails) {
  const segMap = {};
  for (const [pid, coords] of Object.entries(trails)) {
    for (let i = 0; i < coords.length - 1; i++) {
      const key = `${coords[i][0].toFixed(3)},${coords[i][1].toFixed(3)}-${coords[i+1][0].toFixed(3)},${coords[i+1][1].toFixed(3)}`;
      if (!segMap[key]) segMap[key] = [];
      segMap[key].push(pid);
    }
  }
  return segMap;
}

const peopleById = {};
people.forEach(p => peopleById[p.id] = p);

let firstDraw = true;

function drawEverything() {
  map.eachLayer(l => { if (!(l instanceof L.TileLayer)) map.removeLayer(l); });
  const trails = {};
  stops.forEach(stop => {
    (stop.people || []).forEach(pid => {
      if (!trails[pid]) trails[pid] = [];
      trails[pid].push([stop.lat, stop.lon]);
    });
  });

  const shared = getSharedSegments(trails);
  Object.entries(trails).forEach(([pid, coords]) => {
    const color = peopleById[pid]?.color || 'gray';
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i+1];
      const stopA = stops.find(s => Math.abs(s.lat - a[0]) < 0.001 && Math.abs(s.lon - a[1]) < 0.001);
      const stopB = stops.find(s => Math.abs(s.lat - b[0]) < 0.001 && Math.abs(s.lon - b[1]) < 0.001);
      const bothFuture = stopA?.future && stopB?.future;
      const anyFuture = stopA?.future || stopB?.future;

      const key = `${a[0].toFixed(3)},${a[1].toFixed(3)}-${b[0].toFixed(3)},${b[1].toFixed(3)}`;
      const group = shared[key] || [pid];
      const idx = group.indexOf(pid);
      const total = group.length;
      const offsetDir = (idx - (total - 1) / 2) * 0.08; // separate parallel lines a bit

      const path = curveBetween(a, b, 0.15 + offsetDir);
      L.curve(path, {
        color,
        weight: 2.5,
        opacity: bothFuture ? 0.3 : (anyFuture ? 0.6 : 0.9),
        dashArray: bothFuture ? '6,6' : (anyFuture ? '3,6' : null)
      }).addTo(map);
    }
  });

  // stop markers (one per stop)
  stops.forEach(stop => {
    console.log(stop.popup)
    if (stop.popup === false) return; // invisible stop; used for routing only

    const currentPeople = people.filter(p => p.currentStop?.title?.toLowerCase() === stop.title.toLowerCase());
    const isFuture = stop.future;

    // choose icon: combined faces > single face > pin
    let icon;
    if (currentPeople.length > 1) {
      icon = L.divIcon({
        html: makeCombinedFaceHTML(currentPeople.map(p => p.icon)),
        className: 'multi-face-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    } else if (currentPeople.length === 1) {
      icon = L.icon({
        iconUrl: currentPeople[0].icon,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
      });
    } else {
      const pinColor = isFuture ? 'rgba(0,0,0,0.3)' : 'rgb(0,121,130)';
      icon = L.divIcon({
        html: `<div style="font-size:22px;color:${pinColor}">📍</div>`,
        className: '',
        iconSize: [24,24],
        iconAnchor: [12,12]
      });
    }

    const marker = L.marker([stop.lat, stop.lon], { icon, opacity: isFuture ? 0.6 : 1 }).addTo(map);

    let popupText = null;
    if (stop.popup !== false) {
      if (isFuture) {
        popupText = `<i>planned stop</i>`;
      } else {
        popupText = `<b><a href="${stop.url}" class="popup-link">${stop.title}</a></b>`;
      }
    }

    if (popupText) {
      marker.bindPopup(popupText);
      marker.on('click', (e) => {
        e.originalEvent?.stopPropagation?.();
        marker.openPopup();
      });
    }
  });

  if (firstDraw) {
    const pts = stops.map(s => [s.lat, s.lon]);
    if (pts.length) map.fitBounds(pts);
    firstDraw = false;
  }
}

drawEverything();
map.on('zoomend', drawEverything);
</script>

<style>
#trip-map {
  border-radius: 8px;
  /*box-shadow: 0 2px 6px rgba(0,0,0,.1);*/
}

.leaflet-popup-content b {
  font-weight: 500;
  color: #000;
  text-transform: lowercase;
}

.multi-face-marker img {
  border-radius: 50%;
}
</style>