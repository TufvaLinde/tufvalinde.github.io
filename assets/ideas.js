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
const API_KEY = "YOUR_GEOAPIFY_KEY";

const DEFAULT_LOCATION = {
  lat: 11.9344,
  lon: -85.9560,
  label: "Granada, Nicaragua"
};

const WEIRDNESS_CATEGORIES = {
  1: ["tourism.museum"],
  2: ["tourism.sights"],
  3: ["tourism.attraction"],
  4: ["artwork", "historic.ruins"],
  5: ["tourism.attraction", "artwork", "abandoned"]
};

async function generateIdea() {
  const radiusKm = parseFloat(document.getElementById("distance").value) || 5;
  const weirdness = document.getElementById("weirdness").value;

  if (!WEIRDNESS_CATEGORIES[weirdness]) {
    document.getElementById("result").innerText =
      "Invalid weirdness level 😕";
    return;
  }

  const categories = WEIRDNESS_CATEGORIES[weirdness].join(",");

  document.getElementById("result").innerText = "Searching… 🔍";

  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${DEFAULT_LOCATION.lon},${DEFAULT_LOCATION.lat},${radiusKm * 1000}&limit=50&apiKey=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || !data.features.length) {
      document.getElementById("result").innerText =
        "No places found nearby 😕";
      return;
    }

    const random =
      data.features[Math.floor(Math.random() * data.features.length)];

    const name = random.properties.name || "Unknown place";
    const placeCategories = random.properties.categories || "No categories available";
    const lat = random.properties.lat;
    const lon = random.properties.lon;

    document.getElementById("result").innerHTML = `
      <h3>${name}</h3>
      <p>${DEFAULT_LOCATION.label}</p>
      <p>${placeCategories}</p>
      <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank">View on map 🗺️</a>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("result").innerText =
      "Something went wrong ❌";
  }
}
