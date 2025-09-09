const grid = document.getElementById('notes-grid');
const modal = document.getElementById('note-modal');
const modalTitle = document.getElementById('note-modal-title');
const modalContent = document.getElementById('note-modal-content');
const search = document.getElementById('notes-search');

function openModal(title, html) {
  modalTitle.textContent = title || '';
  modalContent.innerHTML = html || '';
  modal.setAttribute('open', '');
  modal.setAttribute('aria-hidden', 'false');
  // focus trap start
  modal.querySelector('.note-modal__close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.removeAttribute('open');
  modal.setAttribute('aria-hidden', 'true');
  modalTitle.textContent = '';
  modalContent.innerHTML = '';
  document.body.style.overflow = '';
}

function onCardClick(e) {
  const card = e.currentTarget;
  const title = card.dataset.title || '';
  const tmpl = card.querySelector('template.note-full');
  const html = tmpl ? tmpl.innerHTML : '';
  openModal(title, html);
}

function wireCards() {
  grid.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', onCardClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick({ currentTarget: card }); }
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
    const excerptText = (card.querySelector('.note-excerpt')?.textContent || '');
    return { card, haystack: (title + ' ' + tags + ' ' + excerptText).toLowerCase() };
  });

  const apply = (q) => {
    const needle = q.trim().toLowerCase();
    cards.forEach(({ card, haystack }) => {
      const show = !needle || haystack.includes(needle);
      card.style.display = show ? '' : 'none';
    });
  };

  // filter as you type
  search.addEventListener('input', (e) => apply(e.target.value));
  // pressing Enter shouldn't submit anything
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
}

wireCards();
wireModal();
wireSearch();