const mainWindow = document.querySelector('#main-window');
const partnerEditWindow = document.querySelector('#partner-edit-window');
const partnerList = document.querySelector('#partner-list');
const partnerForm = document.querySelector('#partner-form');
const partnerType = document.querySelector('#partner-type');
const formTitle = document.querySelector('#form-title');
const formError = document.querySelector('#form-error');
const addButton = document.querySelector('#add-button');
const cancelButton = document.querySelector('#cancel-button');
let editingPartnerId = null;

function setWindowMode(isEditing) {
  mainWindow.hidden = isEditing;
  partnerEditWindow.hidden = !isEditing;
  document.title = isEditing ? 'CRM: Карточка партнера [Редактирование]' : 'CRM: Реестр партнеров';
}

function createPartnerCard(partner) {
  const card = document.createElement('button');
  const details = document.createElement('span');
  const name = document.createElement('strong');
  const contact = document.createElement('span');
  const rating = document.createElement('span');

  card.className = 'partner-card';
  card.type = 'button';
  name.textContent = `${partner.partnerType} «${partner.name}»`;
  contact.textContent = `${partner.director} · ${partner.phone}`;
  rating.textContent = `Рейтинг: ${partner.rating}`;
  details.append(name, contact, rating);
  card.append(details);
  card.addEventListener('click', () => openEditForm(partner.id));

  return card;
}

async function loadPartners() {
  const response = await fetch('/api/partners');
  const partners = await response.json();

  partnerList.replaceChildren(...partners.map(createPartnerCard));
}

async function loadPartnerTypes() {
  const response = await fetch('/api/partner-types');
  const partnerTypes = await response.json();

  partnerType.replaceChildren(...partnerTypes.map((type) => new Option(type, type)));
}

function fillForm(partner) {
  Object.entries(partner).forEach(([fieldName, value]) => {
    const field = partnerForm.elements.namedItem(fieldName);

    if (field) {
      field.value = value;
    }
  });
}

async function openCreateForm() {
  editingPartnerId = null;
  formError.textContent = '';
  partnerForm.reset();
  formTitle.textContent = 'Новый партнер';
  await loadPartnerTypes();
  setWindowMode(true);
}

async function openEditForm(partnerId) {
  const response = await fetch(`/api/partners/${partnerId}`);
  const partner = await response.json();

  editingPartnerId = partnerId;
  formError.textContent = '';
  formTitle.textContent = `Карточка партнера №${partnerId}`;
  await loadPartnerTypes();
  fillForm(partner);
  setWindowMode(true);
}

async function savePartner(event) {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(partnerForm));
  const url = editingPartnerId ? `/api/partners/${editingPartnerId}` : '/api/partners';
  const method = editingPartnerId ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const result = await response.json();

  if (!response.ok) {
    formError.textContent = result.error;
    return;
  }

  setWindowMode(false);
  await loadPartners();
}

addButton.addEventListener('click', openCreateForm);
cancelButton.addEventListener('click', () => setWindowMode(false));
partnerForm.addEventListener('submit', savePartner);
loadPartners();
