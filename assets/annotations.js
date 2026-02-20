(function () {
  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function positionNotes() {
    const container = q('.annot-wrap');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const pageY = window.scrollY || document.documentElement.scrollTop;
    const containerTopOnPage = containerRect.top + pageY;

    qa('.margin-note[data-for]').forEach(note => {
      const id = note.dataset.for;
      const anchor = document.getElementById(id);
      if (!anchor) { note.style.top = ''; return; }

      const aRect = anchor.getBoundingClientRect();
      const anchorTopOnPage = aRect.top + pageY;

      const topWithinContainer = anchorTopOnPage - containerTopOnPage;
      note.style.top = topWithinContainer + 'px';
    });
  }

  let t;
  function debouncedPosition() {
    clearTimeout(t);
    t = setTimeout(positionNotes, 50);
  }
  window.addEventListener('DOMContentLoaded', positionNotes, { once: true });
  window.addEventListener('load', positionNotes, { once: true });
  window.addEventListener('resize', debouncedPosition, { passive: true });
  window.addEventListener('scroll', debouncedPosition, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionNotes);
  }

  const container = document.querySelector('.annot-wrap');
  if (container && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(positionNotes);
    ro.observe(container);
  }
})();