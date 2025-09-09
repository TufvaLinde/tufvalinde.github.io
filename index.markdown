---
layout: default
nav_exclude: true
---
👽 means i have nothing good to say.

## posts
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small>— {{ post.date | date: "%Y-%m-%d" }}</small>
      <!-- {% if post.excerpt %}
        <br><span>{{ post.excerpt | strip_html | truncate: 140 }}</span>
      {% endif %} -->
    </li>
  {% endfor %}
</ul>