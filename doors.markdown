---
layout: default
title: doors
permalink: /doors/
---

<link rel="stylesheet" href="{{ '/assets/doors.css' | relative_url }}?v={{ site.time | date: '%s' }}">

<div class="doors-wrap wrapper">
  <h1>good doors</h1>
  <p>
    this is my growing collection of good doors. please submit new good doors by sending me an email:
    <a href="mailto:tufva@tufvalinde.com">tufva@tufvalinde.com</a>
    with a picture of the door, where you found the door and what you think is behind it.
  </p>

<div class="doors-grid" id="doors-grid">
  {% assign doors = site.doors %}
  {% for door in doors %}
    <article class="door-card" data-title="{{ door.title }}">
      <div class="door" data-tilt="2">
        <img src="{{ door.image | relative_url }}" alt="{{ door.title }}">
      </div>
    </article>
  {% endfor %}
</div>
</div>

<script src="{{ '/assets/doors.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>