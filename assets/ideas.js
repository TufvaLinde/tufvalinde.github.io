/*
==================================================
Random Travel Ideas Generator
Author: David
Purpose: Show random Atlas Obscura locations client-side
==================================================
*/

// Initialize map centered on Nicaragua
const map = L.map('map').setView([12.8654, -85.2072], 7);

// Map tiles
L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
  maxZoom: 16,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Center icon
const centerIcon = L.icon({
  iconUrl: '/assets/ubt/tuf-face.webp',
  iconSize: [50, 50],
  iconAnchor: [25, 50]
});

// Add marker always in the middle
const centerMarker = L.marker(map.getCenter(), { icon: centerIcon }).addTo(map);
map.on('move', () => {
  centerMarker.setLatLng(map.getCenter());
});

// Distance slider
const distanceSlider = document.getElementById('distanceRange');
const distanceDisplay = document.getElementById('distanceValue');
distanceSlider.addEventListener('input', () => {
  distanceDisplay.textContent = distanceSlider.value;
});

// Haversine formula
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fetch local JSON
let placesList = [];
async function fetchPlaces() {
  try {
    const response = await fetch('/assets/places.json');
    if (!response.ok) throw new Error('Failed to fetch JSON');
    placesList = await response.json();
  } catch (err) {
    alert('Error fetching locations: ' + err.message);
    console.error(err);
  }
}

// Show random place within distance
function showRandomPlace() {
  if (!placesList.length) {
    alert('No locations were fetched from the JSON yet.');
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

  // Clear old markers except center
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer !== centerMarker) map.removeLayer(layer);
  });

  // Add marker for the place
  const marker = L.marker([place.coordinates_lat, place.coordinates_lng]).addTo(map);
  const popupContent = `
    <b>${place.title}</b><br>
    <i>${place.location}</i><br>
    ${place.thumbnail_url ? `<img src="${place.thumbnail_url}" style="width:150px;"><br>` : ''}
    <a href="${place.url}" target="_blank">Read more</a>
  `;
  marker.bindPopup(popupContent).openPopup();

  // Center map on location
  map.setView([place.coordinates_lat, place.coordinates_lng], 13);
}

// Button
document.getElementById('randomIdeaBtn').addEventListener('click', showRandomPlace);

// Initial fetch
fetchPlaces();
