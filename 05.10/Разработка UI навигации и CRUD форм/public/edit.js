const form = document.querySelector('#partner-form');
const partnerType = document.querySelector('#partner-type');
const pageTitle = document.querySelector('#page-title');
const message = document.querySelector('#message');
const backButton = document.querySelector('#back-button');
const partnerId = new URLSearchParams(window.location.search).get('partnerId');

function backToMain(selectedId = partnerId) {
  window.location.href = selectedId ? `index.html?selected=${selectedId}` : 'index.html';
}

function fillForm(partner) {
  form.elements.partnerName.value = partner.partner_name;
  form.elements.partnerType.value = partner.partner_type;
  form.elements.rating.value = partner.rating;
  form.elements.address.value = partner.address;
  form.elements.director.value = partner.director;
  form.elements.phone.value = partner.phone;
  form.elements.email.value = partner.email;
}

async function loadPartnerTypes() {
  const response = await fetch('/api/partner-types');
  const types = await response.json();

  partnerType.replaceChildren(...types.map((type) => new Option(type, type)));
}

async function loadPartner() {
  if (!partnerId) {
    document.title = 'CRM: Добавление партнера';
    return;
  }
  const response = await fetch(`/api/partners/${partnerId}`);

  if (!response.ok) throw new Error('Карточка партнера не найдена.');
  const partner = await response.json();

  fillForm(partner);
  pageTitle.textContent = `Карточка партнера №${partner.partner_id}`;
  document.title = 'CRM: Карточка партнера [Редактирование]';
}

async function savePartner(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const url = partnerId ? `/api/partners/${partnerId}` : '/api/partners';
  const method = partnerId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const partner = await response.json();

    if (!response.ok) throw new Error(partner.error);
    message.textContent = 'Данные сохранены. Возвращаемся в реестр.';
    setTimeout(() => backToMain(partner.partner_id), 600);
  } catch (error) {
    message.textContent = `Ошибка: ${error.message}`;
  }
}

backButton.addEventListener('click', () => backToMain());
form.addEventListener('submit', savePartner);
loadPartnerTypes().then(loadPartner).catch((error) => { message.textContent = error.message; });
