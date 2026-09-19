const partnersContainer = document.querySelector('#partners');
const iconColors = ['blue', 'green', 'purple', 'red', 'orange'];

function getInitials(name) {
  return name
    .replaceAll('"', '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

function createTextElement(tagName, text, className = '') {
  const element = document.createElement(tagName);

  element.textContent = text;
  element.className = className;

  return element;
}

function createPartnerCard(partner, index) {
  const card = document.createElement('article');
  const icon = createTextElement('span', getInitials(partner.name), `partner-icon partner-icon--${iconColors[index % iconColors.length]}`);
  const content = document.createElement('div');
  const title = createTextElement('h2', `Партнер | ${partner.name}`);
  const position = createTextElement('p', partner.position, 'partner-card__muted');
  const phone = createTextElement('p', partner.phone);
  const rating = createTextElement('p', `Рейтинг: ${partner.rating}`, 'partner-card__muted');
  const discount = createTextElement('span', `${partner.discount_percent}%`, 'partner-card__discount');

  card.className = 'partner-card';
  content.className = 'partner-card__content';
  content.append(title, position, phone, rating);
  card.append(icon, content, discount);

  return card;
}

function renderPartners(partners) {
  partnersContainer.replaceChildren();

  if (partners.length === 0) {
    partnersContainer.append(createTextElement('p', 'Нет данных о партнёрах.', 'status'));
    return;
  }

  partners.forEach((partner, index) => {
    partnersContainer.append(createPartnerCard(partner, index));
  });
}

async function loadPartners() {
  try {
    const response = await fetch('/api/partners');

    if (!response.ok) {
      throw new Error('Не удалось получить данные партнёров.');
    }

    const partners = await response.json();

    renderPartners(partners);
  } catch (error) {
    partnersContainer.replaceChildren();
    partnersContainer.append(createTextElement('p', error.message, 'status status--error'));
  }
}

loadPartners();
