const partnerTypes = ['ЗАО', 'ООО', 'ИП', 'ОАО', 'ПАО'];

function getPartnerMode(search) {
  const partnerId = new URLSearchParams(search).get('partnerId');

  if (partnerId) {
    return {
      partnerId,
      title: 'CRM: Карточка партнера [Редактирование]',
    };
  }

  return {
    partnerId: null,
    title: 'CRM: Карточка партнера [Добавление]',
  };
}

function fillPartnerTypes(select) {
  partnerTypes.forEach((partnerType) => {
    const option = new Option(partnerType, partnerType);

    select.add(option);
  });
}

function initializePartnerForm() {
  const form = document.querySelector('#partner-form');
  const partnerTypeSelect = document.querySelector('#partner-type');
  const windowTitle = document.querySelector('#window-title');
  const backButton = document.querySelector('#back-button');
  const status = document.querySelector('#form-status');
  const mode = getPartnerMode(window.location.search);

  // partnerId передаётся из MainWindow через адрес страницы при открытии карточки.
  document.title = mode.title;
  windowTitle.textContent = mode.partnerId ? `Карточка партнера №${mode.partnerId}` : 'Новый партнер';
  fillPartnerTypes(partnerTypeSelect);

  backButton.addEventListener('click', () => {
    window.history.back();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = 'Данные формы проверены и готовы к сохранению.';
  });
}

if (typeof document !== 'undefined') {
  initializePartnerForm();
}

if (typeof module !== 'undefined') {
  module.exports = { getPartnerMode, partnerTypes };
}
