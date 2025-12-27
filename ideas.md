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
# Setup

1. Clone or download the Atlas Obscura API repo:
   ```bash
   git clone https://github.com/bartholomej/atlas-obscura-api.git
   cd atlas-obscura-api
   yarn install
   yarn server


# Find a Random Atlas Obscura Location
<p>Choose your distance and click the button to get a random location:</p>

<label for="distanceRange">Distance (km): <span id="distanceValue">5</span> km</label>
<input type="range" id="distanceRange" min="1" max="50" value="5">

<p>Click the button to get a random interesting location in your area!</p>

<button id="randomIdeaBtn">Give me an idea</button>

<div id="map" style="height: 500px; margin-top: 20px;"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="/assets/ideas.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />