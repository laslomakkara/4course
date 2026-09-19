const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplication } = require('./server');

function createTestApplication(stressTest = false) {
  return createApplication({
    databasePath: ':memory:',
    stressTest,
  });
}

test('API возвращает партнёра без продаж с нулевой скидкой', async () => {
  const application = createTestApplication();

  await new Promise((resolve) => application.server.listen(0, resolve));

  const { port } = application.server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/partners`);
  const partners = await response.json();
  const partnerWithoutSales = partners.find((partner) => partner.name === 'ООО "Нулевой объём"');

  assert.equal(response.status, 200);
  assert.equal(partnerWithoutSales.total_quantity, 0);
  assert.equal(partnerWithoutSales.discount_percent, 0);

  application.close();
});

test('интерфейс загружается вместе с API', async () => {
  const application = createTestApplication();

  await new Promise((resolve) => application.server.listen(0, resolve));

  const { port } = application.server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);
  const page = await response.text();

  assert.equal(response.status, 200);
  assert.match(page, /CRM: Список партнеров и скидок/);
  assert.match(page, /id="partners"/);

  application.close();
});

test('стресс-тест добавляет 100 партнёров', () => {
  const application = createTestApplication(true);
  const partners = application.service.getAllPartnersWithDiscount();

  assert.equal(partners.length, 100);
  assert.equal(partners.find((partner) => partner.name === 'ООО "Нулевой объём"').discount_percent, 0);

  application.close();
});
