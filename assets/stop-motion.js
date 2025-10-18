class StopMotion extends HTMLElement {
  async connectedCallback() {
    const folder = this.getAttribute("folder");
    const fps = parseFloat(this.getAttribute("fps")) || 12;
    const img = document.createElement("img");
    this.appendChild(img);

    try {
      const response = await fetch(`${folder}/frames.json`);
      const data = await response.json();
      const frames = data.frames.map(f => `${folder}/${f}`);
      if (!frames.length) throw new Error("No frames found");

      let i = 0;
      const delay = 1000 / fps;

      const nextFrame = () => {
        img.src = frames[i];
        i = (i + 1) % frames.length;
      };

      nextFrame();
      this._interval = setInterval(nextFrame, delay);
    } catch (err) {
      console.error("StopMotion error:", err);
      this.textContent = "Error loading animation.";
    }
  }

  disconnectedCallback() {
    if (this._interval) clearInterval(this._interval);
  }
}

customElements.define("stop-motion", StopMotion);