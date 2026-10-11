const form = document.querySelector('#partner-form');
const partnerType = document.querySelector('#partner-type');
const pageTitle = document.querySelector('#page-title');
const backButton = document.querySelector('#back-button');
// ID из адресной строки определяет: открыть пустую форму или карточку выбранного партнера.
const partnerId = new URLSearchParams(window.location.search).get('partnerId');
let initialFormState = '';

function backToMain(selectedId = partnerId) {
  // selected возвращает выделение в реестре после сохранения или перехода назад.
  window.location.href = selectedId ? `index.html?selected=${selectedId}` : 'index.html';
}

function getFormState() {
  return new URLSearchParams(new FormData(form)).toString();
}

function validatePartner(data) {
  if (!data.partnerName.trim()) {
    return 'Введите наименование партнера и повторите сохранение.';
  }

  if (!data.email.trim()) {
    return 'Введите Email компании в формате name@example.com и повторите сохранение.';
  }

  if (!data.partnerType.trim() || !data.address.trim() || !data.director.trim() || !data.phone.trim()) {
    return 'Заполните тип партнера, адрес, данные директора и телефон, затем повторите сохранение.';
  }

  if (!data.rating.trim() || !Number.isInteger(Number(data.rating)) || Number(data.rating) < 0) {
    return 'Рейтинг должен быть целым числом от 0. Удалите дробную часть или знак минус и повторите попытку.';
  }

  return null;
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

  if (!response.ok) throw new Error('Не удалось получить список типов партнеров.');
  const types = await response.json();

  partnerType.replaceChildren(...types.map((type) => new Option(type, type)));
}

async function loadPartner() {
  if (!partnerId) {
    document.title = 'CRM: Добавление партнера';
    return;
  }
  const response = await fetch(`/api/partners/${partnerId}`);

  if (!response.ok) throw new Error('Карточка партнера не найдена. Вернитесь в реестр и выберите партнера заново.');
  const partner = await response.json();

  fillForm(partner);
  pageTitle.textContent = `Карточка партнера №${partner.partner_id}`;
  document.title = 'CRM: Карточка партнера [Редактирование]';
}

async function returnToMain() {
  if (getFormState() !== initialFormState) {
    const shouldLeave = await showMessageBox({
      type: 'warning',
      title: 'Несохраненные изменения',
      text: 'Изменения будут потеряны без возможности восстановления. Нажмите «Покинуть», только если сохранять данные не нужно.',
      confirmText: 'Покинуть',
      cancelText: 'Остаться',
    });

    if (!shouldLeave) return;
  }

  backToMain();
}

async function savePartner(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const validationError = validatePartner(data);

  if (validationError) {
    await showMessageBox({ type: 'error', title: 'Ошибка ввода', text: validationError });
    return;
  }

  const url = partnerId ? `/api/partners/${partnerId}` : '/api/partners';
  const method = partnerId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const partner = await response.json();

    if (!response.ok) throw new Error(partner.error);
    await showMessageBox({ type: 'information', title: 'Данные сохранены', text: 'Карточка партнера успешно сохранена. Сейчас откроется обновленный реестр.' });
    backToMain(partner.partner_id);
  } catch (error) {
    await showMessageBox({
      type: 'error',
      title: 'Не удалось сохранить данные',
      text: `Проверьте подключение к базе данных, перезапустите приложение командой npm start и повторите попытку. Техническая причина: ${error.message}`,
    });
  }
}

function rememberInitialFormState() {
  initialFormState = getFormState();
}

async function showLoadingError(error) {
  await showMessageBox({
    type: 'error',
    title: 'Ошибка загрузки',
    text: `${error.message} Проверьте, что сервер запущен командой npm start.`,
  });
}

backButton.addEventListener('click', returnToMain);
form.addEventListener('submit', savePartner);
loadPartnerTypes()
  .then(loadPartner)
  .then(rememberInitialFormState)
  .catch(showLoadingError);
