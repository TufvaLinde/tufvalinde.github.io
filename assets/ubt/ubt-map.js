/* UBT Map Logic */
(function() {
  if (typeof L === 'undefined') {
    console.error('Leaflet not loaded!');
    return;
  }

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

function curveBetween(a, b, amplitude = 0.2) {
  const latMid = (a[0] + b[0]) / 2;
  const lonMid = (a[1] + b[1]) / 2;
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const dist = Math.sqrt(dx*dx + dy*dy);
  const nx = -dy / dist;
  const ny = dx / dist;
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
      const offsetDir = (idx - (total - 1) / 2) * 0.08;

      const path = curveBetween(a, b, 0.15 + offsetDir);
      L.curve(path, {
        color,
        weight: 2.5,
        opacity: bothFuture ? 0.3 : (anyFuture ? 0.6 : 0.9),
        dashArray: bothFuture ? '6,6' : (anyFuture ? '3,6' : null)
      }).addTo(map);
    }
  });

  stops.forEach(stop => {
    console.log(stop.popup)
    if (stop.popup === false) return;

    const currentPeople = people.filter(p => p.currentStop?.title?.toLowerCase() === stop.title.toLowerCase());
    const isFuture = stop.future;

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
        html: `<div style="font-size:30px;color:${pinColor}">📍</div>`,
        className: '',
        iconSize: [30,30],
        iconAnchor: [150, 15]
      });
    }

    const marker = L.marker([stop.lat, stop.lon], { icon, opacity: isFuture ? 0.6 : 1 }).addTo(map);

    let popupText = null;
    if (stop.popup !== false) {
      if (isFuture) {
        popupText = `<b><i>planned stop</i><br></br><i>${stop.dateStr}</i></b>`;
      } else {
        popupText = `<b><a href="${stop.url}" class="popup-link">${stop.title}</a><br></br><i>${stop.dateStr}</i></b>`;
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
  
const volleyballIcon = L.icon({
  iconUrl: '/assets/ubt/volleyball.webp',
  iconSize: [12, 12],
  iconAnchor: [6, 12],
  popupAnchor: [0, -10]
});

courts.forEach(court => {
  if (!court.lat || !court.lon) return; 

  const marker = L.marker([court.lat, court.lon], { icon: volleyballIcon }).addTo(map);

  const popupHTML = `
    <div class="court-popup">
      <b>${court.title}</b><br>
      <i>${court.dateStr ? `visited: ${court.dateStr}` : 'date unknown'}</i><br><br>
      <div>sand: ${court.sand ?? '-'} /10</div>
      <div>court: ${court.court ?? '-'} /10</div>
      <div>player level: ${court.playerlevel ?? '-'} /10</div>
      ${court.comment ? `<p class="court-comment">${court.comment}</p>` : ''}
    </div>
  `;

  marker.bindPopup(popupHTML);
});


  if (firstDraw) {
    const pts = stops.map(s => [s.lat, s.lon]);
    if (pts.length) map.fitBounds(pts);
    firstDraw = false;
  }
}

drawEverything();
map.on('zoomend', drawEverything);
})();