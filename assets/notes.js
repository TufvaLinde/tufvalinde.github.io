const grid = document.getElementById('notes-grid');
const modal = document.getElementById('note-modal');
const modalTitle = document.getElementById('note-modal-title');
const modalMeta = document.getElementById('note-modal-meta');
const modalContent = document.getElementById('note-modal-content');
const search = document.getElementById('notes-search');

function openModal({ title, html, date, tags }) {
  modalTitle.textContent = title || '';
  // build meta line if present
  if (modalMeta) {
    if (date || tags) {
      const parts = [];
      if (date) parts.push(date);
      if (tags) parts.push(tags);
      modalMeta.textContent = parts.join(' · ');
      modalMeta.style.display = '';
    } else {
      modalMeta.textContent = '';
      modalMeta.style.display = 'none';
    }
  }
  modalContent.innerHTML = html || '';
  modal.setAttribute('open', '');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.note-modal__close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.removeAttribute('open');
  modal.setAttribute('aria-hidden', 'true');
  modalTitle.textContent = '';
  if (modalMeta) modalMeta.textContent = '';
  modalContent.innerHTML = '';
  document.body.style.overflow = '';
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
  modal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('open')) closeModal();
  });
}

function wireSearch() {
  if (!search) return;
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

wireCards();
wireModal();
wireSearch();