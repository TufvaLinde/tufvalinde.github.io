---
layout: default
title: doors
permalink: /doors/
---

<link rel="stylesheet" href="{{ '/assets/doors.css' | relative_url }}?v={{ site.time | date: '%s' }}">

<div class="doors-wrap wrapper">
  <h1>good doors</h1>
  <p>
    this is my collection of good doors. please submit new good doors by sending me an email:
    <a href="mailto:tufva@tufvalinde.com">tufva@tufvalinde.com</a>
    with a picture of the door, where you found it and what you think is behind it.
  </p>

<div class="doors-grid" id="doors-grid">
  {% assign doors = site.doors %}
  {% for door in doors %}
    <article class="door-card">
      <div class="door">
        <div class="door-media" style="--ratio: 3/5">
          <img
            src="{{ door.image | relative_url }}"
            alt="{{ door.title | escape }}"
            loading="lazy"
            decoding="async"
            {% if forloop.index0 < 6 %}fetchpriority="high"{% else %}fetchpriority="low"{% endif %}
          >
        </div>
      </div>
    </article>
  {% endfor %}
</div>

</div>

<link rel="stylesheet" href="{{ '/assets/doors.css' | relative_url }}?v={{ site.time | date: '%s' }}">
<script src="{{ '/assets/doors.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>
