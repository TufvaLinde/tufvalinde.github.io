---
layout: ubt
title: UBT
permalink: /ultimate-beach-tour/
---

<div id="current-status">
  <div class="ripped-paper">
    <p class="status-label">we are currently:</p>
    <p class="status-text">
      becoming DJs in the nicaraguan jungle.
    </p>
  </div>
</div>


<section id="map-widget">
  <h2>minimap</h2>
  <p class="header-thing">follow our adventure! press the pins in the map to see more from each location.</p>
  <div id="trip-map"></div>
</section>

<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-curve"></script>
<link rel="stylesheet" href="{{ '/assets/ubt/ubt.css' | relative_url }}">

<script>
  const courts = [
    {% for c in site.ubtcourts %}
      {% if c.lat and c.lon %}
      {
        "title": {{ c.title | jsonify }},
        "lat": {{ c.lat | jsonify }},
        "lon": {{ c.lon | jsonify }},
        "dateStr": {{ c.date | date: "%b %-d, %Y" | jsonify }},
        "dateNum": {{ c.date | date: "%s" | plus: 0 | jsonify }},
        "sand": {{ c.sand | default: "null" | jsonify }},
        "court": {{ c.court | default: "null" | jsonify }},
        "playerlevel": {{ c.playerlevel | default: "null" | jsonify }},
        "comment": {{ c.comment | jsonify }}
      }{% unless forloop.last %},{% endunless %}
      {% endif %}
    {% endfor %}
  ];

  const people = [
    {% for p in site.ubtpeople %}
    {
      "id": "{{ p.person_id | default: p.basename | strip }}",
      "name": "{{ p.name | escape }}",
      "color": "{{ p.color | escape }}",
      "icon": "{{ p.icon | relative_url }}"
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  const stops = [
    {% for n in site.ubtstops %}
      {% if n.lat and n.lon %}
      {
        "title": "{{ n.title | escape }}",
        "lat": {{ n.lat }},
        "lon": {{ n.lon }},
        "url": "{{ n.url | relative_url }}",
        "dateStr": "{{ n.date | date: '%b %-d, %Y' }}",
        "dateNum": {{ n.date | date: '%s' | plus: 0 }},
        "popup": {{ n.popup | default: true | jsonify }},
        "people": [{% if n.person %}{% if n.person.first %}{% for id in n.person %}"{{ id }}"{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}"{{ n.person | strip }}" {% endif %}{% endif %}],
        "background": "{{ n.background | escape }}",
      }{% unless forloop.last %},{% endunless %}
      {% endif %}
    {% endfor %}
  ];
</script>

<script src="{{ '/assets/ubt/ubt-map.js' | relative_url }}"></script>

<section id="posts-widget">
  <h2>story</h2>
  <p class="header-thing">read excerpts from the adventure in the form of chapters :) written from tufs perspective</p>
  <ul class="post-list">
    {% for post in site.posts %}
      {% unless post.draft %}
      {% if post.ubt %}
        <li> 
          <a class="post-link" href="{{ post.url | relative_url }}">
            {{ post.title }}
            <span class="post-date">{{ post.date | date: "%b %-d, %Y" }}</span>
          </a>
        </li>
      {% endif %}
      {% endunless %}
    {% endfor %}
  </ul>
</section>

<section id="sketch-loop">
  <h2>sketching</h2>
    <p class="header-thing">ink sketches by tuf.</p>
  <img id="skatch" src="/assets/ubt/sketch1.webp">
</section>

