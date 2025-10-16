class MarginNote extends HTMLElement {
  connectedCallback() {
    const targetId = this.getAttribute("target");
    if (!targetId) return;

    // Find the target element
    const targetEl = document.querySelector(`[data-note="${targetId}"]`);
    if (!targetEl) {
      console.warn(`MarginNote: no matching annotated element for "${targetId}"`);
      return;
    }

    const wrapper =
      document.querySelector(".page-content .wrapper") || document.body;

    // === Create margin bubble (for desktop) ===
    const noteBubble = document.createElement("div");
    noteBubble.className = "margin-note-bubble";
    noteBubble.innerHTML = this.innerHTML;

    // === Apply color ===
    const rawColor =
      this.getAttribute("color") || this.dataset.color || "rgb(149, 149, 159)";
    const color = getComputedStyle(document.body)
      ? rawColor
      : "rgb(149, 149, 159)";
    noteBubble.style.setProperty("--note-color", color);

    wrapper.appendChild(noteBubble);

    // === Highlight the annotated text ===
    targetEl.classList.add("has-margin-note");
    targetEl.style.setProperty(
      "--highlight-color",
      color.replace("rgb", "rgba").replace(")", ", 0.2)")
    );
    targetEl.style.cursor = "pointer";

    // === Position the margin note bubble ===
    const updatePosition = () => {
      if (window.innerWidth < 950) {
        noteBubble.style.display = "none";
        return;
      }
      noteBubble.style.display = "block";
      const rect = targetEl.getBoundingClientRect();
      const containerRect = wrapper.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const top = rect.top - containerRect.top + scrollY;
      noteBubble.style.position = "absolute";
      noteBubble.style.top = `${top}px`;
      noteBubble.style.left = "calc(100% + 20px)";
    };

    window.addEventListener("load", updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    updatePosition();

    // === Mobile modal for narrow viewports ===
    const modal = document.createElement("div");
    modal.className = "margin-note-modal";
    modal.innerHTML = `
      <div class="margin-note-overlay"></div>
      <div class="margin-note-modal-content" style="border-color:${color}">
        <button class="margin-note-close" aria-label="Close">&times;</button>
        ${this.innerHTML}
      </div>
    `;
    document.body.appendChild(modal);

    const openModal = (e) => {
      e.preventDefault();
      modal.classList.add("open");
      document.body.classList.add("modal-open");
    };

    const closeModal = () => {
      modal.classList.remove("open");
      document.body.classList.remove("modal-open");
    };

    // === Corrected: Pass event object ===
    targetEl.addEventListener("click", (e) => {
      if (window.innerWidth < 950) openModal(e);
    });

    modal
      .querySelector(".margin-note-close")
      .addEventListener("click", closeModal);
    modal
      .querySelector(".margin-note-overlay")
      .addEventListener("click", closeModal);
  }
}

customElements.define("margin-note", MarginNote);