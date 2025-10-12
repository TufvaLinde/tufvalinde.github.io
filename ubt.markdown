---
layout: ubt
title: UBT
permalink: /ultimate-beach-tour/
---

# ultimate beach tour

<p>
coming soon. <br><br>
below is our route, with stories from each stop
</p>

<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

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
  {
    title: "{{ n.title | escape }}",
    lat: {{ n.lat }},
    lon: {{ n.lon }},
    url: "{{ n.url | relative_url }}",
    date: "{{ n.date | date: '%b %-d, %Y' }}",
    people: [{% if n.person %}{% for pid in n.person %}"{{ pid | strip }}"{% unless forloop.last %}, {% endunless %}{% endfor %}{% endif %}]
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];

console.log("people:", people);
console.log("stops:", stops);

const map = L.map('trip-map').setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoCDN',
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

// Build lookup for people
const peopleById = {};
people.forEach(p => {
  peopleById[p.id] = {
    name: p.name,
    color: p.color,
    icon: L.icon({
      iconUrl: p.icon,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35]
    })
  };
});

const trails = {};
const allCoords = [];
const seenCoords = {};

// Add markers
stops.forEach(stop => {
  if (!stop.people || !stop.people.length) return;
  let { lat, lon } = stop;

  // prevent total overlap
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (seenCoords[key]) {
    const offset = 0.03 * seenCoords[key];
    lat += offset;
    lon += offset;
    seenCoords[key]++;
  } else {
    seenCoords[key] = 1;
  }

  const point = [lat, lon];
  allCoords.push(point);

  // show names in popup
  const popupHtml = `<b>${stop.title}</b><br>${stop.date}<br>` +
    stop.people.map(pid => peopleById[pid]?.name || pid).join(', ');

  stop.people.forEach(pid => {
    const person = peopleById[pid];
    if (!person) return;

    if (!trails[pid]) trails[pid] = [];
    trails[pid].push(point);

    const marker = L.marker(point, { icon: person.icon }).addTo(map);
    marker.bindPopup(popupHtml);
    marker.on('click', () => window.location.href = stop.url);
  });
});

// Draw trails per person
Object.entries(trails).forEach(([id, coords]) => {
  const color = peopleById[id]?.color || 'gray';
  L.polyline(coords, { color, weight: 2.5, opacity: 0.8 }).addTo(map);
});

if (allCoords.length) map.fitBounds(allCoords);

// Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'ubt-legend');
  div.innerHTML = '<strong>Routes</strong><br>' +
    people.map(p => `
      <div style="display:flex;align-items:center;gap:6px;margin:1px 0;">
        <img src="${p.icon}" style="width:20px;height:20px;border-radius:50%;" />
        <span style="color:${p.color}">${p.name}</span>
      </div>
    `).join('');
  return div;
};
legend.addTo(map);
</script>

<style>
#trip-map { border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,.1); }
.ubt-legend {
  background: rgba(255,255,255,0.9);
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
</style>