// Initialize the map centered on Nicaragua
const nicaraguaLatLng = [12.865416, -85.207229]; // approximate center of Nicaragua
const map = L.map('map').setView(nicaraguaLatLng, 7); // zoom level 7 for country view

// Add tile layer
L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
  maxZoom: 16,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Custom icon for map center
const centerIcon = L.icon({
  iconUrl: '/assets/tuf-face.webp', // your custom pin
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Marker at map center
const centerMarker = L.marker(nicaraguaLatLng, { icon: centerIcon })
  .addTo(map)
  .bindPopup('<b>Map Center: Nicaragua</b>')
  .openPopup();

// Load places JSON
let placesList = [];
async function fetchPlaces() {
  try {
    const response = await fetch('/assets/places.json');
    placesList = await response.json();
    if (!placesList.length) {
      alert('No locations were loaded from places.json!');
    }
  } catch (err) {
    console.error('Failed to load places.json:', err);
    alert('Failed to load places.json! Check the file path.');
  }
}

// Distance slider
const distanceSlider = document.getElementById('distanceRange');
const distanceDisplay = document.getElementById('distanceValue');
distanceSlider.addEventListener('input', () => {
  distanceDisplay.textContent = distanceSlider.value;
});

// Haversine formula for distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Show random place
function showRandomPlace() {
  if (!placesList.length) {
    alert('No locations were fetched yet! Make sure places.json is loaded.');
    return;
  }

  const center = map.getCenter();
  const maxDistance = parseFloat(distanceSlider.value);

  const nearby = placesList.filter(p => 
    getDistance(center.lat, center.lng, p.coordinates_lat, p.coordinates_lng) <= maxDistance
  );

  if (!nearby.length) {
    alert('No places found within this distance!');
    return;
  }

  const randomIndex = Math.floor(Math.random() * nearby.length);
  const place = nearby[randomIndex];

  // Clear previous markers except the center
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer !== centerMarker) map.removeLayer(layer);
  });

  const marker = L.marker([place.coordinates_lat, place.coordinates_lng]).addTo(map);
  const popupContent = `
    <b>${place.title}</b><br>
    <i>${place.location}</i><br>
    <img src="${place.thumbnail_url}" alt="${place.title}" style="width:150px;"><br>
    <a href="${place.url}" target="_blank">Read more</a>
  `;
  marker.bindPopup(popupContent).openPopup();

  map.setView([place.coordinates_lat, place.coordinates_lng], 13);
}

// Button event
document.getElementById('randomIdeaBtn').addEventListener('click', showRandomPlace);

// Initial fetch
fetchPlaces();
