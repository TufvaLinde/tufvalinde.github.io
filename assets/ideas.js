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

// Initialize the map (centered on Nicaragua)
const map = L.map('map').setView([12.8654, -85.2072], 7); // Nicaragua center

L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
  maxZoom: 16,
  attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

let placesList = [];

// Slider & display
const distanceSlider = document.getElementById('distanceRange');
const distanceDisplay = document.getElementById('distanceValue');
distanceSlider.min = 1;
distanceSlider.max = 500;
distanceSlider.value = 50; // default
distanceDisplay.textContent = distanceSlider.value;

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

// Fetch places from local JSON
async function fetchPlaces() {
  try {
    const response = await fetch('/assets/data/places.json');
    if (!response.ok) throw new Error('Failed to fetch JSON');
    placesList = await response.json();
    console.log('Places loaded:', placesList.length);
  } catch (err) {
    console.error('Error loading places:', err);
    alert('Error loading places. Make sure /assets/data/places.json exists.');
  }
}

// Show a random place within distance
function showRandomPlace() {
  if (!placesList.length) {
    alert('No locations were loaded yet!');
    return;
  }

  const center = map.getCenter();
  const maxDistance = parseFloat(distanceSlider.value);

  con
