---
layout: emptyslate
title: Random Travel Ideas
permalink: /ideas/

---

<style>
  .big-red-button {
    background-color: #e74c3c;
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    padding: 15px 40px;
    border: none;
    border-radius: 10px;
    box-shadow: 0 5px #c0392b;
    cursor: pointer;
    transition: all 0.1s ease-in-out;
  }

  .big-red-button:active {
    transform: translateY(4px);
    box-shadow: 0 1px #c0392b;
  }

  .big-red-button:hover {
    background-color: #ff4d4d;
  }
</style>



# Let's find ideas for new places to go!

<label for="distance">Distance (km):</label>
<input id="distance" type="number" value="5" min="1" max="50">

<label for="weirdness">Weirdness level (1-5):</label>
<select id="weirdness">
  <option value="1">1 - Mild</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5 - Weirdest</option>
</select>

<button class="big-red-button" onclick="generateIdea()">Generate</button>


<div id="result"></div>

<script src="{{ '/assets/ideas.js' | relative_url }}"></script>


<!-- Map container -->
<div id="map" style="height: 400px; width: 100%; margin-top: 20px;"></div>

<!-- Leaflet CSS & JS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<!-- Map initialization -->
<script>
  // Set default coordinates (e.g., Granada, Nicaragua)
  const DEFAULT_LAT = 11.9344;
  const DEFAULT_LON = -85.9560;
  const DEFAULT_ZOOM = 13;

  // Initialize map
  const map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM);

  // Add Stamen Watercolor tile layer via Stadia Maps
  L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.webpjpg, {
    maxZoom: 16,
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  }).addTo(map);

  // Optional: add a marker at default location
  L.marker([DEFAULT_LAT, DEFAULT_LON])
    .addTo(map)
    .bindPopup("Granada, Nicaragua")
    .openPopup();
</script>
