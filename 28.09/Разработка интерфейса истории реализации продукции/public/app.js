const mainWindow = document.querySelector('#main-window');
const partnerEditWindow = document.querySelector('#partner-edit-window');
const partnerList = document.querySelector('#partner-list');
const partnerForm = document.querySelector('#partner-form');
const partnerType = document.querySelector('#partner-type');
const formTitle = document.querySelector('#form-title');
const addButton = document.querySelector('#add-button');
const cancelButton = document.querySelector('#cancel-button');
const historyButton = document.querySelector('#history-button');
let selectedPartnerId = null;
let editingPartnerId = null;

function showError(message) {
  window.alert(`Ошибка: ${message}`);
}

function setWindowMode(isEditing) {
  mainWindow.hidden = isEditing;
  partnerEditWindow.hidden = !isEditing;
  document.title = isEditing ? 'CRM: Карточка партнера [Редактирование]' : 'CRM: Реестр партнеров';
}

function createPartnerCard(partner) {
  const card = document.createElement('article');
  const name = document.createElement('strong');
  const contact = document.createElement('span');
  const rating = document.createElement('span');

  card.className = 'partner-card';
  name.textContent = `${partner.partnerType} «${partner.name}»`;
  contact.textContent = `${partner.director} · ${partner.phone}`;
  rating.textContent = `Рейтинг: ${partner.rating}`;
  card.append(name, contact, rating);
  card.addEventListener('click', () => selectPartner(partner.id, card));
  card.addEventListener('dblclick', () => openEditForm(partner.id));
  return card;
}

function selectPartner(partnerId, card) {
  document.querySelectorAll('.partner-card').forEach((item) => item.classList.remove('partner-card--selected'));
  card.classList.add('partner-card--selected');
  selectedPartnerId = partnerId;
  historyButton.disabled = false;
}

async function loadPartners() {
  try {
    const response = await fetch('/api/partners');
    if (!response.ok) throw new Error('Не удалось загрузить список партнеров.');
    const partners = await response.json();
    partnerList.replaceChildren(...partners.map(createPartnerCard));
    selectedPartnerId = null;
    historyButton.disabled = true;
  } catch (error) {
    showError(error.message);
  }
}

async function loadPartnerTypes() {
  const response = await fetch('/api/partner-types');
  if (!response.ok) throw new Error('Не удалось загрузить типы партнеров.');
  partnerType.replaceChildren(...(await response.json()).map((type) => new Option(type, type)));
}

function fillForm(partner) {
  Object.entries(partner).forEach(([name, value]) => {
    const field = partnerForm.elements.namedItem(name);
    if (field) field.value = value;
  });
}

async function openCreateForm() {
  editingPartnerId = null;
  partnerForm.reset();
  formTitle.textContent = 'Новый партнер';
  await loadPartnerTypes();
  setWindowMode(true);
}

async function openEditForm(partnerId) {
  try {
    const response = await fetch(`/api/partners/${partnerId}`);
    if (!response.ok) throw new Error('Не удалось открыть карточку партнера.');
    editingPartnerId = partnerId;
    await loadPartnerTypes();
    fillForm(await response.json());
    formTitle.textContent = 'Карточка партнера';
    setWindowMode(true);
  } catch (error) {
    showError(error.message);
  }
}

async function savePartner(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(partnerForm));
  const url = editingPartnerId ? `/api/partners/${editingPartnerId}` : '/api/partners';

  try {
    const response = await fetch(url, { method: editingPartnerId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    window.alert(editingPartnerId ? 'Данные партнера обновлены.' : 'Партнер добавлен.');
    setWindowMode(false);
    await loadPartners();
  } catch (error) {
    showError(error.message);
  }
}

addButton.addEventListener('click', () => openCreateForm().catch((error) => showError(error.message)));
cancelButton.addEventListener('click', () => setWindowMode(false));
historyButton.addEventListener('click', () => { window.location.href = `history.html?partnerId=${selectedPartnerId}`; });
partnerForm.addEventListener('submit', savePartner);
loadPartners();
