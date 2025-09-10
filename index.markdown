---
layout: default
nav_exclude: true
---
👽 means i have nothing good to say

## posts
<ul class="post-list">
  {% for post in site.posts %}
    <li>
    <a href="{{ post.url | relative_url }}">
      {{ post.title }}
      <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
    </a>
      
      <!-- {% if post.excerpt %}
        <br><span>{{ post.excerpt | strip_html | truncate: 140 }}</span>
      {% endif %} -->
    </li>
  {% endfor %}
</ul>