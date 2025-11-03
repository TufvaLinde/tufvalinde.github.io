---
layout: default
title: "🕵️ Tuft’s Sandpit"
permalink: /~tufva-sandpit/
robots: noindex
---
<style>
  h1 { text-align: center; margin-top: 1rem; }
  ul { list-style: none; padding: 0; }
  li { margin: 0.3rem 0; }
  a { text-decoration: none; color: #0077cc; }
  a:hover { text-decoration: underline; }
</style>

<h1>🕵️ Drafts Preview</h1>

<ul>
  {% assign drafts = site.posts | where: "draft", true %}
  {% for post in drafts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <small>({{ post.date | date_to_string }})</small>
    </li>
  {% endfor %}
</ul>