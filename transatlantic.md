---
title: transatlantic
layout: default
permalink: /transatlantic/
---

<link rel="stylesheet" href="{{ '/assets/passagemap/passagemap.css' | relative_url }}">

<h1>TRANSATLANTIC<br>CROSSING 2026</h1>

<span class="update-text">this page was updated on May 17th</span>

hello blog reader

this is a good life update: I am sailing from the caribbean to croatia *right now*. we set out on April 22nd and should arrive sometime in early June. 

I know some people worry about the risk of us sinking and drowning and such. I cannot promise that I am okay (no one can. ever) and for obvious reasons it is hard to stay in touch with me while I am on the open ocean. if you want to know how the journey is going I have an <span data-note="blast">email blast</span> where I send weeklish updates :) feel free to sign up or shoot me an email on my regular address: <a href="mailto:tufva@tufvalinde.com">tufva@tufvalinde.com</a>.

<margin-note target="blast" color="rgb(0, 0, 0)">
  <b>transatlantic email blast</b>
  <form class="email-blast-form" action="https://formspree.io/f/meedgqgw" method="POST">
  <label>
    your email
    <input type="email" name="email" required>
  </label>

  <label>
    name (if you want)
    <input type="text" name="name">
  </label>

  <button class="blast-button">
    sign up
  </button>
</form>
</margin-note>

oh, and after a few weeks at sea I got bored and extracted all the data in our logbook to create empirical polars. that was fun. now that I had this .csv file with all our coordinates and stuff and I figured I'd use it to share our track here in a fun little map. see below! we write in the logbook whenever there is a watch change (every 3 hours). this is to to keep track of all sorts of things; our position, the wind, battery levels, diesel, etc. here I included our LOG (total nautical miles), COG (course over ground), SOG (speed over ground) and observations.

the map will be updated when I have energy and internet connection

fair winds! <3

<div class="passage-map-shell">
  <div class="passage-map" data-csv="/assets/passagemap/logbookdata.csv"></div>
  <aside class="passage-log-panel" id="passage-log-panel"></aside>
  <svg class="passage-connector" aria-hidden="true">

  <line id="passage-connector-line" x1="0" y1="0" x2="0" y2="0"></line>
</svg>
</div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="{{ '/assets/passagemap/passagemap.js' | relative_url }}"></script>