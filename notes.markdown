---
layout: default
title: notes
permalink: /notes/
---

<link rel="stylesheet" href="{{ '/assets/notes.css' | relative_url }}">
<div class="notes-toolbar">
  <input id="notes-search" type="search" placeholder="Search notes…">
</div>


<div class="notes-grid" id="notes-grid">
{% assign notes = site.notes %}
{% unless notes %}
  {% assign notes = site.collections.notes.docs %}
{% endunless %}

{% if notes and notes.size > 0 %}
  {%- assign notes_with_date = notes | where_exp: "i", "i.date" | sort: "date" | reverse -%}
  {%- assign notes_no_date  = notes | where_exp: "i", "i.date == nil" -%}
  {%- assign notes_sorted   = notes_with_date | concat: notes_no_date -%}

  {% for n in notes_sorted %}
    {%- assign pretty_date = n.date | date: "%b %-d, %Y" -%}
    {%- assign tags_str = n.tags | join: ", " -%}

    <article class="note-card"
             tabindex="0"
             data-title="{{ n.title | escape }}"
             {% if n.date %}data-date="{{ pretty_date }}"{% endif %}
             {% if n.tags %}data-tags="{{ tags_str | escape }}"{% endif %}>
      <header class="note-title">{{ n.title }}</header>

      {%- if n.date or n.tags -%}
      <div class="note-meta">
        {%- if n.date -%}<span class="note-date">{{ pretty_date }}</span>{% endif -%}
        {%- if n.date and n.tags.size > 0 -%}
          <span aria-hidden="true"> · </span>
        {%- endif -%}
        {%- if n.tags -%}
        <span class="note-tags">
        {% for tag in n.tags %}
        
          <p class="note-tag"> {{tag}} </p>
        
        {% endfor %}
        </span>
        {% endif -%}
      </div>
      {%- endif -%}

      <div class="note-excerpt">
        {% assign html = n.excerpt | default: n.content %}
        {{ html | markdownify }}
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
    <div class="note-modal__header">
      <div class="note-modal__headings">
        <h2 class="note-modal__title" id="note-modal-title"></h2>
        <div class="note-modal__meta" id="note-modal-meta" aria-live="polite"></div>
      </div>
      <button class="note-modal__close" type="button" aria-label="Close" data-close>×</button>
    </div>

    <div class="note-modal__content" id="note-modal-content"></div>
  </div>
</div>

<script type="module" src="{{ '/assets/notes.js' | relative_url }}"></script>