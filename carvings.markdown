---
layout: emptyslate
permalink: /carvings/
categories: creativity
nav_exclude: true
sitemap: false
---

<style>

  body {
    background: rgb(205, 251, 246);
  }

  .holder {
      display: flex;
      flex-direction: column;
      height: 50vh;
      width: 50vw; /*change when adding more carvings lol*/
      overflow: visible;
  }

  stop-motion  {
    display: flex;
    justify-content: center;
  }

  stop-motion img {
    position: relative;
    object-fit: contain;
  }

  @media (max-width: 640px) {
    .centeringthingy {
      flex-direction: column;
    }

      .holder {
      width: 100vw;
  }

  }

  
</style>

<div class="holder" style="height: 680px;">
    <p style="margin-bottom: 20px; font-family: 'Coral Pixels'; text-align: center;" >hattifnatt</p>
    <stop-motion height="600px" folder="/assets/stopmotion/hattifnatt" fps="10"></stop-motion>
</div>

<div class="holder" style="height: 530px;">
    <p style="margin-bottom: 20px; font-family: 'Coral Pixels'; text-align: center;" >long limbed creature</p>
    <stop-motion height="470px" folder="/assets/stopmotion/longlimb1" fps="10"></stop-motion>
</div>

