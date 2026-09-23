function validatePartnerData(data) {
  if (!data.name || data.name.trim() === '') {
    return 'Введите наименование партнера и повторите попытку.';
  }

  if (!data.email || data.email.trim() === '') {
    return 'Введите email компании в формате company@example.com и повторите попытку.';
  }

  if (!/^\d+$/.test(data.rating ?? '')) {
    return 'Рейтинг должен быть целым числом от 0. Удалите знаки препинания и повторите попытку.';
  }

  return null;
}

if (typeof document !== 'undefined') {
const mainWindow = document.querySelector('#main-window');
const partnerEditWindow = document.querySelector('#partner-edit-window');
const partnerList = document.querySelector('#partner-list');
const partnerForm = document.querySelector('#partner-form');
const partnerType = document.querySelector('#partner-type');
const formTitle = document.querySelector('#form-title');
const addButton = document.querySelector('#add-button');
const cancelButton = document.querySelector('#cancel-button');
const modalBackdrop = document.querySelector('#modal-backdrop');
const modalIcon = document.querySelector('#modal-icon');
const modalTitle = document.querySelector('#modal-title');
const modalMessage = document.querySelector('#modal-message');
const modalActions = document.querySelector('#modal-actions');
let editingPartnerId = null;
let isDirty = false;

function showDialog(type, title, message, actions) {
  modalIcon.className = `modal__icon modal__icon--${type}`;
  modalIcon.textContent = type === 'error' ? '×' : type === 'warning' ? '!' : 'i';
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalActions.replaceChildren();
  actions.forEach(({ label, primary = false, handler }) => {
    const button = document.createElement('button');

    button.className = primary ? 'button button--primary' : 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      modalBackdrop.hidden = true;
      handler();
    });
    modalActions.append(button);
  });
  modalBackdrop.hidden = false;
}

function showInformation(message) {
  showDialog('information', 'Сохранение выполнено', message, [
    { label: 'Хорошо', primary: true, handler() {} },
  ]);
}

function showError(message) {
  showDialog('error', 'Ошибка ввода или сохранения', message, [
    { label: 'Исправить', primary: true, handler() {} },
  ]);
}

function setWindowMode(isEditing) {
  mainWindow.hidden = isEditing;
  partnerEditWindow.hidden = !isEditing;
  document.title = isEditing ? 'CRM: Карточка партнера [Редактирование]' : 'CRM: Реестр партнеров';
}

function createPartnerCard(partner) {
  const card = document.createElement('button');
  const name = document.createElement('strong');
  const contact = document.createElement('span');
  const rating = document.createElement('span');

  card.className = 'partner-card';
  card.type = 'button';
  name.textContent = `${partner.partnerType} «${partner.name}»`;
  contact.textContent = `${partner.director} · ${partner.phone}`;
  rating.textContent = `Рейтинг: ${partner.rating}`;
  card.append(name, contact, rating);
  card.addEventListener('click', () => openEditForm(partner.id));

  return card;
}

async function loadPartners() {
  try {
    const response = await fetch('/api/partners');

    if (!response.ok) {
      throw new Error('СУБД недоступна. Проверьте, что сервер запущен, и повторите попытку.');
    }

    const partners = await response.json();

    partnerList.replaceChildren(...partners.map(createPartnerCard));
  } catch (error) {
    showError(error.message);
  }
}

async function loadPartnerTypes() {
  const response = await fetch('/api/partner-types');

  if (!response.ok) {
    throw new Error('Не удалось получить типы партнеров. Перезапустите приложение и повторите попытку.');
  }

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
  try {
    editingPartnerId = null;
    isDirty = false;
    partnerForm.reset();
    formTitle.textContent = 'Новый партнер';
    await loadPartnerTypes();
    setWindowMode(true);
  } catch (error) {
    showError(error.message);
  }
}

async function openEditForm(partnerId) {
  try {
    const response = await fetch(`/api/partners/${partnerId}`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить карточку партнера. Обновите страницу и повторите попытку.');
    }

    const partner = await response.json();

    editingPartnerId = partnerId;
    isDirty = false;
    formTitle.textContent = `Карточка партнера №${partnerId}`;
    await loadPartnerTypes();
    fillForm(partner);
    setWindowMode(true);
  } catch (error) {
    showError(error.message);
  }
}

function returnToRegistry() {
  isDirty = false;
  setWindowMode(false);
}

function cancelEditing() {
  if (!isDirty) {
    returnToRegistry();
    return;
  }

  showDialog('warning', 'Несохраненные изменения', 'Все введённые данные будут потеряны. Вернуться в реестр без сохранения?', [
    { label: 'Продолжить редактирование', handler() {} },
    { label: 'Потерять изменения', primary: true, handler: returnToRegistry },
  ]);
}

async function savePartner(event) {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(partnerForm));
  const validationError = validatePartnerData(formData);

  if (validationError) {
    showError(validationError);
    return;
  }

  const url = editingPartnerId ? `/api/partners/${editingPartnerId}` : '/api/partners';
  const method = editingPartnerId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error);
    }

    returnToRegistry();
    await loadPartners();
    showInformation(editingPartnerId ? 'Данные партнера успешно обновлены.' : 'Новый партнер успешно добавлен в базу.');
  } catch (error) {
    showError(error.message || 'СУБД недоступна. Перезапустите приложение и повторите попытку.');
  }
}

addButton.addEventListener('click', openCreateForm);
cancelButton.addEventListener('click', cancelEditing);
partnerForm.addEventListener('input', () => {
  isDirty = true;
});
partnerForm.addEventListener('submit', savePartner);
loadPartners();
}

if (typeof module !== 'undefined') {
  module.exports = { validatePartnerData };
}
