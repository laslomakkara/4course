const historyList = document.querySelector('#history-list');
const pageTitle = document.querySelector('#page-title');
const backButton = document.querySelector('#back-button');
const partnerId = new URLSearchParams(window.location.search).get('partnerId');

function createHistoryRow(sale) {
  const row = document.createElement('tr');
  const productCell = document.createElement('td');
  const dateCell = document.createElement('td');
  const quantityCell = document.createElement('td');

  productCell.textContent = sale.product_name;
  dateCell.textContent = new Intl.DateTimeFormat('ru-RU').format(new Date(`${sale.sale_date}T00:00:00`));
  quantityCell.textContent = sale.quantity;
  row.append(productCell, dateCell, quantityCell);
  return row;
}

async function loadHistory() {
  const partnerResponse = await fetch(`/api/partners/${partnerId}`);
  const historyResponse = await fetch(`/api/partners/${partnerId}/history`);

  if (!partnerResponse.ok || !historyResponse.ok) throw new Error('Не удалось загрузить историю продаж.');
  const partner = await partnerResponse.json();
  const history = await historyResponse.json();

  pageTitle.textContent = `История продаж: ${partner.partner_name}`;
  document.title = `CRM: История реализации продукции — ${partner.partner_name}`;
  historyList.replaceChildren(...history.map(createHistoryRow));
}

backButton.addEventListener('click', () => {
  window.location.href = `index.html?selected=${partnerId}`;
});
loadHistory().catch((error) => {
  const row = document.createElement('tr');
  const cell = document.createElement('td');

  cell.colSpan = 3;
  cell.textContent = error.message;
  row.append(cell);
  historyList.replaceChildren(row);
});
