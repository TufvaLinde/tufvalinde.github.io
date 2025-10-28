---
layout: emptyslate
permalink: /carvings/
categories: creativity
nav_exclude: true
sitemap: false
---

<style>

  .centeringthingy {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      margin-top: 5vh;
  }

  body {
    background: rgb(205, 251, 246);
  }


  h1 {
  width: 100%;
  text-align: center;
  position: relative;
  animation: glitch 1s infinite;
}

.glitch {
  position: relative;
  color: white;
  font-family: "coral pixels", monospace;
  font-size: 15vw;
  text-align: center;
  animation: glitch-skew 1s infinite linear alternate-reverse;
}

/* Red channel */
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  color: white;
}

.glitch::before {

  animation: glitch-anim 20s infinite linear alternate-reverse;
}

.glitch::after {
  left: -4px;
  text-shadow: 4px 0 blue;
  clip-path: inset(0 0 0 0);
  animation: glitch-anim2 0.3s infinite linear alternate-reverse;
}

/* Random clipping + shaking */
@keyframes glitch-anim {
  0% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, -4px); }
  10% { clip-path: inset(10% 0 80% 0); transform: translate(4px, 4px); }
  20% { clip-path: inset(40% 0 43% 0); transform: translate(-6px, 2px); }
  30% { clip-path: inset(80% 0 5% 0); transform: translate(6px, -2px); }
  40% { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 6px); }
  50% { clip-path: inset(10% 0 70% 0); transform: translate(4px, -6px); }
  60% { clip-path: inset(90% 0 2% 0); transform: translate(-2px, 4px); }
  70% { clip-path: inset(0 0 100% 0); transform: translate(2px, -2px); }
  80% { clip-path: inset(45% 0 40% 0); transform: translate(-6px, 4px); }
  90% { clip-path: inset(15% 0 70% 0); transform: translate(6px, 2px); }
  100% { clip-path: inset(0 0 0 0); transform: translate(0); }
}

@keyframes glitch-anim2 {
  0% { clip-path: inset(70% 0 20% 0); transform: translate(6px, 4px); }
  10% { clip-path: inset(10% 0 85% 0); transform: translate(-4px, -2px); }
  20% { clip-path: inset(40% 0 43% 0); transform: translate(4px, 6px); }
  30% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, -6px); }
  40% { clip-path: inset(50% 0 30% 0); transform: translate(2px, 4px); }
  50% { clip-path: inset(10% 0 70% 0); transform: translate(-4px, 2px); }
  60% { clip-path: inset(90% 0 2% 0); transform: translate(6px, -4px); }
  70% { clip-path: inset(0 0 100% 0); transform: translate(-6px, 4px); }
  80% { clip-path: inset(45% 0 40% 0); transform: translate(4px, -2px); }
  90% { clip-path: inset(15% 0 70% 0); transform: translate(-2px, 6px); }
  100% { clip-path: inset(0 0 0 0); transform: translate(0); }
}

@keyframes glitch-skew {
  0% { transform: skew(0deg); }
  10% { transform: skew(2deg); }
  20% { transform: skew(-2deg); }
  30% { transform: skew(1deg); }
  40% { transform: skew(-1deg); }
  50% { transform: skew(3deg); }
  60% { transform: skew(-3deg); }
  70% { transform: skew(1deg); }
  80% { transform: skew(-1deg); }
  90% { transform: skew(2deg); }
  100% { transform: skew(0deg); }
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

<h1 class="glitch" data-text="carvings">carvings</h1>

<div class="centeringthingy">
    <div class="holder" style="height: 680px;">
        <p style="margin-bottom: 20px; font-family: 'Coral Pixels'; text-align: center;" >hattifnatt</p>
        <stop-motion height="600px" folder="/assets/stopmotion/hattifnatt" fps="10"></stop-motion>
    </div>

    <div class="holder" style="height: 530px;">
        <p style="margin-bottom: 20px; font-family: 'Coral Pixels'; text-align: center;" >long limbed creature</p>
        <stop-motion height="470px" folder="/assets/stopmotion/longlimb1" fps="10"></stop-motion>
    </div>
</div>


