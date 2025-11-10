---
layout: ubt
title: UBT
permalink: /ultimate-beach-tour/
---


<section id="map-widget">
  <h2>minimap</h2>
  <p class ="header-thing">follow our adventure! press the pins in the map to see more from each location.</p>
  <div id="trip-map"></div>
</section>

<section id="posts-widget">
  <h2>posts</h2>
  <p class ="header-thing">links to blog posts connected to the journey</p>
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


<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-curve"></script>

<link rel="stylesheet" href="{{ '/assets/ubt/ubt.css' | relative_url }}">
<script>

  const courts = [
  {% for c in site.ubtcourts %}
    {% if c.lat and c.lon %}
    {
      title: “{{ c.title | escape }}”,
      lat: {{ c.lat }},
      lon: {{ c.lon }},
      dateStr: “{{ c.date | date: ‘%b %-d, %Y’ }}”,
      dateNum: {{ c.date | date: ‘%s’ | plus: 0 }},
      sand: {{ c.sand | default: ‘null’ }},
      net: {{ c.net | default: ‘null’ }},
      playerlevel: {{ c.playerlevel | default: ‘null’ }},
      comment: {{ c.comment | jsonify }}
    {% endif %}
  {% endfor %}
];

  const people = [
    {% for p in site.ubtpeople %}
    {
      id: "{{ p.person_id | default: p.basename | strip }}",
      name: "{{ p.name | escape }}",
      color: "{{ p.color | escape }}",
      icon: "{{ p.icon | relative_url }}"
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  const stops = [
    {% for n in site.ubtstops %}
      {% if n.lat and n.lon %}
      {
        title: "{{ n.title | escape }}",
        lat: {{ n.lat }},
        lon: {{ n.lon }},
        url: "{{ n.url | relative_url }}",
        dateStr: "{{ n.date | date: '%b %-d, %Y' }}",
        dateNum: {{ n.date | date: '%s' | plus: 0 }},
        popup: {{ n.popup | default: true | jsonify }},
        people: [{% if n.person %}{% if n.person.first %}{% for id in n.person %}"{{ id }}"{% unless forloop.last %}, {% endunless %}{% endfor %}{% else %}"{{ n.person | strip }}" {% endif %}{% endif %}]
      }{% unless forloop.last %},{% endunless %}
      {% endif %}
    {% endfor %}
  ];
  
</script>

<div id=“debug-courts” style=“white-space: pre-wrap; font-family: monospace; background: #f8f8f8; padding: 1em; border: 1px solid #ddd; margin: 1em 0;”></div>
<script>
  document.getElementById(‘debug-courts’).innerText =
    “Loaded courts:\n” + JSON.stringify(courts, null, 2);
</script>

<script src="{{ '/assets/ubt/ubt-map.js' | relative_url }}"></script>