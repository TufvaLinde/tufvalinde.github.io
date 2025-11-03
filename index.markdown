---
layout: default
nav_exclude: true
---

👽 means i have nothing good to say.

## posts
<ul class="post-list">
  {% for post in site.posts %}
    {% unless post.draft %}
      <li>
        <a class="post-link" href="{{ post.url | relative_url }}">
          {{ post.title }}
          <span class="post-date">{{ post.date | date: "%b %-d, %Y" }}</span>
        </a>
      </li>
    {% endunless %}
  {% endfor %}
</ul>
