/*
==================================================
TEMPORARY FEATURE: Random Travel Ideas Generator
Author: <David>
Purpose: Do dumb stuff on the interwebs
Safe to delete:
- assets/ideas.js
- ideas.md
==================================================
/*
==================================================
Random Travel Ideas Generator - Local JSON Version
Author: David
Purpose: Pick a random place from local JSON without needing a server
==================================================
*/

/*
==================================================
Random Travel Ideas Generator
Author: David
Purpose: Show random Atlas Obscura locations from a local JSON file
==================================================
*/

// Initialize the map (center on Nicaragua)
const map = L.map('map').setView([12.8654, -85.2072], 7);

L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
  maxZoom: 16,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Load local JSON
let placesList = [];
async function fetchPlaces() {
  try {
    const response = await fetch('/assets/data/places.json');
    if (!response.ok) throw new Error('Failed to fetch JSON file.');
    placesList = await response.json();
    console.log(`Loaded ${placesList.length} locations from JSON.`);
  } catch (err) {
    alert('Failed to load locations JSON! Check that the file exists and is valid.');
    console.error(err);
  }
}

// Slider & display
const distanceSlider = document.getElementById('distanceRange');
const distanceDisplay = document.getElementById('distanceValue');
distanceSlider.addEventListener('input', () => {
  distanceDisplay.textContent = distanceSlider.value;
});

// Haversine formula to calculate distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Show a random place within distance
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

  const place = nearby[Math.floor(Math.random() * nearby.length)];

  // Clear previous markers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });

  // Add marker
  const marker = L.marker([place.coordinates_lat, place.coordinates_lng]).addTo(map);
  const popupContent = `
    <b>${place.title}</b><br>
    <i>${place.location}</i><br>
    <img src="${place.thumbnail_url}" alt="${place.title}" style="width:150px;"><br>
    <a href="${place.url}" target="_blank">Read more</a>
  `;
  marker.bindPopup(popupContent).openPopup();

  // Center map
  map.setView([place.coordinates_lat, place.coordinates_lng], 12);
}

// Button event
document.getElementById('randomIdeaBtn').addEventListener('click', showRandomPlace);

// Initial fetch
fetchPlaces();
