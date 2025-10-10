class MarginNote extends HTMLElement {
  connectedCallback() {
    const targetId = this.getAttribute("target");
    if (!targetId) return;

    // Find the highlighted text span
    const targetEl = document.querySelector(`[data-note="${targetId}"]`);
    if (!targetEl) return;

    // Add a highlight style to the target text
    targetEl.classList.add("has-margin-note");

    // Insert the note bubble into the DOM (after content wrapper)
    const wrapper = document.querySelector(".page-content .wrapper");
    if (!wrapper) return;

    const noteBubble = document.createElement("div");
    noteBubble.className = "margin-note-bubble";
    noteBubble.innerHTML = this.innerHTML;

    // Positioning reference
    const rect = targetEl.getBoundingClientRect();
    const containerRect = wrapper.getBoundingClientRect();
    const yOffset = rect.top - containerRect.top;

    noteBubble.style.top = `${yOffset}px`;

    function positionNotes() {
        document.querySelectorAll('.margin-note').forEach(note => {
            const id = note.dataset.for;
            const anchor = document.getElementById(id);
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            note.style.top = (rect.top + scrollTop) + "px";
        });
    }

    window.addEventListener("load", positionNotes);
    window.addEventListener("resize", positionNotes);
    window.addEventListener("scroll", positionNotes);

    // Store for later adjustments
    wrapper.appendChild(noteBubble);

    // On mobile, clicking the highlight shows modal instead
    targetEl.addEventListener("click", () => {
      if (window.innerWidth < 720) {
        alert(this.innerText); // replace with a prettier modal later
      }
    });
  }
}
customElements.define("margin-note", MarginNote);