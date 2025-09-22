const grid        = document.getElementById('notes-grid');
const modal       = document.getElementById('note-modal');
const modalTitle  = document.getElementById('note-modal-title');
const modalMeta   = document.getElementById('note-modal-meta');
const modalContent= document.getElementById('note-modal-content');
const search      = document.getElementById('notes-search');

let canCloseClicks = false;

function setMeta({ date, tags }) {
  if (!modalMeta) return;
  const parts = [];
  if (date) parts.push(date);
  if (tags) parts.push(tags);
  if (parts.length) {
    modalMeta.textContent = parts.join(' · ');
    modalMeta.style.display = '';
  } else {
    modalMeta.textContent = '';
    modalMeta.style.display = 'none';
  }
}

function openModal({ title, html, date, tags }) {
  modalTitle.textContent = title || '';
  setMeta({ date, tags });
  modalContent.innerHTML = html || '';

  modal.classList.remove('closing');
  modal.removeAttribute('aria-hidden');

  requestAnimationFrame(() => {
    modal.setAttribute('open', '');
    canCloseClicks = false;
    setTimeout(() => { canCloseClicks = true; }, 180);

    const dlg = modal.querySelector('.note-modal__dialog');
    if (dlg) dlg.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
  });
}

function closeModal() {
  const dlg = modal.querySelector('.note-modal__dialog');
  const prevHeight = dlg ? dlg.offsetHeight : null;
  if (dlg && prevHeight) {
    dlg.style.height = prevHeight + 'px';
  }

  modal.classList.add('closing');

  const finish = () => {
    modal.removeEventListener('animationend', finish);
    if (dlg) dlg.style.height = '';
    modal.classList.remove('closing');
    modal.removeAttribute('open');
    modal.setAttribute('aria-hidden', 'true');
    modalTitle.textContent = '';
    if (modalMeta) modalMeta.textContent = '';
    modalContent.innerHTML = '';
    document.body.style.overflow = '';
  };

  modal.addEventListener('animationend', finish, { once: true });
}

function onCardClick(e) {
  const card = e.currentTarget;
  const title = card.dataset.title || '';
  const date  = card.dataset.date || '';
  const tags  = card.dataset.tags || '';
  const tmpl  = card.querySelector('template.note-full');
  const html  = tmpl ? tmpl.innerHTML : '';
  openModal({ title, html, date, tags });
}

function wireCards() {
  if (!grid) return;
  grid.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', onCardClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick({ currentTarget: card });
      }
    });
  });
}

function wireModal() {
  const dlg = modal.querySelector('.note-modal__dialog');
  if (dlg && !dlg.hasAttribute('tabindex')) dlg.setAttribute('tabindex', '-1');

  modal.addEventListener('click', (e) => {
    if (!canCloseClicks) return;
    const t = e.target;
    if (t.hasAttribute('data-close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('open')) closeModal();
  });
}

function wireSearch() {
  if (!search || !grid) return;
  const cards = Array.from(grid.querySelectorAll('.note-card')).map(card => {
    const title = (card.dataset.title || '');
    const tags  = (card.dataset.tags || '');
    const date  = (card.dataset.date || '');
    const excerptHtml = (card.querySelector('.note-excerpt')?.innerHTML || '');
    const haystack = (title + ' ' + tags + ' ' + date + ' ' + excerptHtml)
      .replace(/<[^>]+>/g, '')
      .toLowerCase();
    return { card, haystack };
  });

  const apply = (q) => {
    const needle = q.trim().toLowerCase();
    cards.forEach(({ card, haystack }) => {
      card.style.display = (!needle || haystack.includes(needle)) ? '' : 'none';
    });
  };

  search.addEventListener('input', (e) => apply(e.target.value));
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
}

function enforceClosedOnLoad() {
  modal.classList.remove('closing');
  modal.removeAttribute('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function init() {
  if (!grid || !modal) return;
  enforceClosedOnLoad();
  wireCards();
  wireModal();
  wireSearch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}