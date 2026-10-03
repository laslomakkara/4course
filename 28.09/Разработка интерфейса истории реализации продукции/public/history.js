const historyTitle = document.querySelector('#history-title');
const historyTableBody = document.querySelector('#history-table-body');
const historyMessage = document.querySelector('#history-message');
const partnerId = new URLSearchParams(window.location.search).get('partnerId');

function createHistoryRow(sale) {
  const row = document.createElement('tr');
  const productCell = document.createElement('td');
  const quantityCell = document.createElement('td');
  const dateCell = document.createElement('td');

  productCell.textContent = sale.product_name;
  quantityCell.textContent = sale.quantity.toLocaleString('ru-RU');
  dateCell.textContent = sale.sale_date;
  row.append(productCell, quantityCell, dateCell);

  return row;
}

async function loadHistory() {
  const response = await fetch(`/api/partners/${partnerId}/history`);

  if (!response.ok) {
    historyMessage.textContent = 'Не удалось загрузить историю продаж. Вернитесь в реестр и выберите партнера снова.';
    return;
  }

  const { partner, sales } = await response.json();

  document.title = `CRM: История реализации продукции — ${partner.name}`;
  historyTitle.textContent = `История реализации продукции — ${partner.name}`;
  historyTableBody.replaceChildren(...sales.map(createHistoryRow));

  if (sales.length === 0) {
    historyMessage.textContent = 'У партнера пока нет записей о реализации продукции.';
  }
}

document.querySelector('#back-button').addEventListener('click', () => {
  window.location.href = 'index.html';
});

loadHistory();
