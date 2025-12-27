---
layout: emptyslate
title: Random Travel Ideas
permalink: /ideas/
---

<style>
  .big-red-button {
    background-color: #e74c3c;  /* bright red */
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    padding: 15px 40px;
    border: none;
    border-radius: 50px;        /* makes it round */
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

<p>Choose your distance and click the button to get a random idea:</p>

<label for="distanceRange">Distance (km): <span id="distanceValue">50</span> km</label>
<input type="range" id="distanceRange" min="1" max="500" value="50">

<p>Let's get some ideas for s(tuf)f to do!</p>

<button class="big-red-button" id="randomIdeaBtn">Give me s(tuf)f to do</button>

<div id="map" style="height: 500px; margin-top: 20px;"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="/assets/ideas.js"></script>

---

## How it works

1. The map starts centered on **Nicaragua**
2. Drag the map to your location of interest.
3. Adjust the slider to set the **maximum distance** for the random idea.
4. Click the **"Give me s(tuf)f to do"** button!  

