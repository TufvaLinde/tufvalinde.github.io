/*
==================================================
TEMPORARY FEATURE: Random Travel Ideas Generator
Author: <David>
Purpose: Do dumb stuff on the interwebs
Safe to delete:
- assets/ideas.js
- ideas.md
==================================================
*/
// ideas.js
// Make sure Leaflet is included in your HTML

// Initialize the map
const map = L.map('map').setView([51.5074, -0.1278], 13); // Default: London

L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
  maxZoom: 16,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// API base
const API_BASE = 'http://localhost:3000'; // Atlas Obscura API server
const API_KEY = ''; // optional if you set one

let placesList = [];

// Slider & display
const distanceSlider = document.getElementById('distanceRange');
const distanceDisplay = document.getElementById('distanceValue');
distanceSlider.addEventListener('input', () => {
  distanceDisplay.textContent = distanceSlider.value;
});

// Haversine formula to calculate distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fetch all places once
async function fetchPlaces() {
  try {
    const response = await fetch(`${API_BASE}/places-all${API_KEY ? '?api_key=' + API_KEY : ''}`);
    placesList = await response.json();
  } catch (err) {
    console.error('Error fetching places:', err);
  }
}

// Show a random place within distance
async function showRandomPlace() {
  if (!placesList.length) return;

  // Use map center as reference point
  const center = map.getCenter();
  const maxDistance = parseFloat(distanceSlider.value);

  // Filter places within distance
  const nearby = placesList.filter(p => 
    getDistance(center.lat, center.lng, p.lat, p.lng) <= maxDistance
  );

  if (!nearby.length) {
    alert('No places found within this distance!');
    return;
  }

  // Pick a random place
  const randomIndex = Math.floor(Math.random() * nearby.length);
  const place = nearby[randomIndex];

  try {
    const response = await fetch(`${API_BASE}/place-full/${place.id}${API_KEY ? '?api_key=' + API_KEY : ''}`);
    const details = await response.json();

    // Clear previous markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // Add marker
    const marker = L.marker([details.coordinates.lat, details.coordinates.lng]).addTo(map);
    const popupContent = `
      <b>${details.title}</b><br>
      <i>${details.location}</i><br>
      <img src="${details.thumbnail_url}" alt="${details.title}" style="width:150px;"><br>
      <a href="https://www.atlasobscura.com${details.url}" target="_blank">Read more</a>
    `;
    marker.bindPopup(popupContent).openPopup();

    // Center map
    map.setView([details.coordinates.lat, details.coordinates.lng], 15);
  } catch (err) {
    console.error('Error fetching place details:', err);
  }
}

// Button event
document.getElementById('randomIdeaBtn').addEventListener('click', showRandomPlace);

// Initial fetch
fetchPlaces();
