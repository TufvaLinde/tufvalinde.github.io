---
layout: default
title: Notes
permalink: /notes/
---

<link rel="stylesheet" href="{{ '/assets/notes.css' | relative_url }}">

<h1>Notes</h1>
<div class="notes-toolbar">
  <input id="notes-search" type="search" placeholder="Search notes…">
</div>

<div class="notes-grid" id="notes-grid">
{% assign notes = site.notes %}
{% unless notes %}
  {% assign notes = site.collections.notes.docs %}
{% endunless %}

{% if notes and notes.size > 0 %}
  {% assign notes = notes | sort: 'date' | reverse %}
  {% for n in notes %}
    <article class="note-card" tabindex="0" data-title="{{ n.title | escape }}">
      <header class="note-title">{{ n.title }}</header>
      <div class="note-excerpt">
        {% if n.excerpt %}
          {{ n.excerpt | strip_html | truncate: 180 }}
        {% else %}
          {{ n.content | strip_html | truncate: 180 }}
        {% endif %}
      </div>
      <template class="note-full">
        {{ n.content | markdownify }}
      </template>
    </article>
  {% endfor %}
{% else %}
  <p>No notes found. Create some in <code>_notes/</code> 🎯</p>
{% endif %}
</div>

<!-- Modal -->
<div class="note-modal" id="note-modal" aria-hidden="true">
  <div class="note-modal__backdrop" data-close></div>
  <div class="note-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
    <button class="note-modal__close" type="button" aria-label="Close" data-close>×</button>
    <h2 class="note-modal__title" id="note-modal-title"></h2>
    <div class="note-modal__content" id="note-modal-content"></div>
  </div>
</div>

<script type="module" src="{{ '/assets/notes.js' | relative_url }}"></script>