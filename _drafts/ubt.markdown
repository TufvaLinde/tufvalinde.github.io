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
// --- Collect data from Jekyll ---
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
      dateStr: "{{ n.date | date: '%b %-d, %Y' }}",
      dateNum: {{ n.date | date: '%s' | plus: 0 }},
      people: [{% if n.person %}{% if n.person.first %}{% for id in n.person %}"{{ id }}"{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}"{{ n.person | strip }}" {% endif %}{% endif %}]
    }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];

// your stops array definition above here...

// Determine "future" dynamically in the browser
const now = Math.floor(Date.now() / 1000);
stops.forEach(s => s.future = s.dateNum > now);


people.forEach(p => {
  // find the latest stop this person has reached
  const pastStops = stops.filter(s =>
    s.people?.includes(p.id) && s.dateNum <= now
  );

  // sort by dateNum descending
  pastStops.sort((a, b) => b.dateNum - a.dateNum);

  // assign currentStop (or null if none)
  p.currentStop = pastStops.length ? pastStops[0] : null;
});

console.log("People with currentStop:", people);

// --- Initialize map ---
const map = L.map('trip-map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoCDN',
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

// --- Prepare people and icons ---
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

// --- Prepare data containers ---
const trails = {};
const allCoords = [];
const seenCoords = {};

// --- Place markers and trails ---
stops.forEach(stop => {
  if (!stop.people || !stop.people.length) return;

  let { lat, lon } = stop;
  // offset overlapping pins slightly
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

  stop.people.forEach(pid => {
    const person = peopleById[pid];
    if (!person) return;

    if (!trails[pid]) trails[pid] = [];
    trails[pid].push(point);

    const isFuture = stop.future === true;
    const iconCurrent = L.divIcon({
      html: '<div style="font-size: 22px; font-weight: bold; color: rgb(0,121,130);">N</div>',
      className: '', // remove Leaflet default styles
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const iconPast = L.divIcon({
      html: '<div style="font-size: 22px; font-weight: bold; color: #555;">H</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const isCurrent = person.currentStop?.title === stop.title;

    const marker = L.marker(point, { 
      icon: isCurrent ? iconCurrent : iconPast,
      opacity: isFuture ? 0.6 : 1
    }).addTo(map);

    console.log(stop.title + " is future: " + isFuture + ", is current: " + isCurrent)

    if (isFuture) {
      // FUTURE STOP — show popup only
      marker.bindPopup(
        `<i>Planned stop</i>`
      );
    } else {
      // PAST or CURRENT STOP — clickable popup
      const popupHtml = `
        <b><a href="${stop.url}" class="popup-link">${stop.title}</a></b><br>
        ${stop.date}
      `;
      marker.bindPopup(popupHtml);

      // Only open popup, not navigate
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        marker.openPopup();
      });
    }
  });
});

// --- Draw trails ---
Object.entries(trails).forEach(([id, coords]) => {
  const color = peopleById[id]?.color || 'gray';

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];

    // find stops at these coords
    const stopA = stops.find(s => Math.abs(s.lat - a[0]) < 0.001 && Math.abs(s.lon - a[1]) < 0.001);
    const stopB = stops.find(s => Math.abs(s.lat - b[0]) < 0.001 && Math.abs(s.lon - b[1]) < 0.001);

    const bothFuture = stopA?.future && stopB?.future;
    const anyFuture = stopA?.future || stopB?.future;

    L.polyline([a, b], {
      color,
      weight: 2.5,
      opacity: bothFuture ? 0.3 : (anyFuture ? 0.6 : 0.9),
      dashArray: bothFuture ? '6,6' : (anyFuture ? '3,6' : null)
    }).addTo(map);
  }
});

if (allCoords.length) map.fitBounds(allCoords);

// --- Legend ---
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'ubt-legend');
  div.innerHTML = '<strong>Routes</strong><br>' +
    people.map(p => `
      <div style="display:flex;align-items:center;gap:6px;margin:1px 0;">
        <img src="${p.icon}" style="width:20px;height:20px;border-radius:50%;" />
        <span style="color:${p.color}">${p.name}</span>
      </div>
    `).join('') +
    '<hr><small>📍 visited &nbsp;&nbsp;📍 (faded) planned</small>';
  return div;
};
legend.addTo(map);
</script>

<style>
#trip-map {
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,.1);
}

.ubt-legend {
  background: rgba(255,255,255,0.95);
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

/* popup link styling */
.leaflet-popup-content a.popup-link {
  color: rgb(0,121,130);
  text-decoration: none;
  font-weight: 600;
}
.leaflet-popup-content a.popup-link:hover {
  text-decoration: underline;
}
</style>