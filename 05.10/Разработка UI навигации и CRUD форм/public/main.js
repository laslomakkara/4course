const partnerList = document.querySelector('#partner-list');
const editButton = document.querySelector('#edit-button');
const historyButton = document.querySelector('#history-button');
const selectedPartnerId = new URLSearchParams(window.location.search).get('selected');
let currentPartnerId = selectedPartnerId ? Number(selectedPartnerId) : null;

function openEditWindow() {
  window.location.href = `edit.html?partnerId=${currentPartnerId}`;
}

function openHistoryWindow() {
  window.location.href = `history.html?partnerId=${currentPartnerId}`;
}

function selectPartner(partnerId, card) {
  document.querySelectorAll('.partner-card').forEach((item) => item.classList.remove('partner-card--selected'));
  card.classList.add('partner-card--selected');
  currentPartnerId = partnerId;
  editButton.disabled = false;
  historyButton.disabled = false;
}

function createPartnerCard(partner) {
  const card = document.createElement('article');
  const emblem = document.createElement('span');
  const content = document.createElement('div');
  const name = document.createElement('strong');
  const details = document.createElement('span');
  const rating = document.createElement('span');

  card.className = 'partner-card';
  emblem.className = `partner-emblem partner-emblem--${partner.partner_id % 5}`;
  emblem.textContent = partner.partner_name.trim().charAt(0).toUpperCase();
  content.className = 'partner-card__content';
  name.textContent = `${partner.partner_type} «${partner.partner_name}»`;
  details.textContent = `${partner.director} · ${partner.phone}`;
  rating.textContent = `Рейтинг: ${partner.rating}`;
  content.append(name, details, rating);
  card.append(emblem, content);
  card.addEventListener('click', () => selectPartner(partner.partner_id, card));
  card.addEventListener('dblclick', openEditWindow);

  if (partner.partner_id === currentPartnerId) selectPartner(partner.partner_id, card);
  return card;
}

async function loadPartners() {
  const response = await fetch('/api/partners');

  if (!response.ok) throw new Error('Не удалось загрузить список партнеров.');
  const partners = await response.json();

  partnerList.replaceChildren(...partners.map(createPartnerCard));
}

editButton.addEventListener('click', openEditWindow);
historyButton.addEventListener('click', openHistoryWindow);
loadPartners().catch((error) => { partnerList.textContent = error.message; });
