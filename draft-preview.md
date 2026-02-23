---
title: draft
layout: emptyslate
---

<link rel="stylesheet" href="{{ '/assets/log/log.css' | relative_url }}">

<div id="logViewport">
  <div id="logGrid"></div>
</div>

<script src="{{ '/assets/log/log.js' | relative_url }}"></script>


{% include textsphere.html
  id="ch2-sphere"
  text_url="assets/textsphere/words.txt"
  parse="sentences"
  slices=18
  max_lines=70
  font_family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  font_weight="900"
  font_px=42
  spin=0.0018
  draggable=true
%}
