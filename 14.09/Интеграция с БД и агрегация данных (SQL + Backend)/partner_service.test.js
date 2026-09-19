const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { createPartnerService } = require('./partner_service');

function createTestService() {
  const database = new DatabaseSync(':memory:');
  const service = createPartnerService(database);

  service.initializeDatabase();

  return { database, service };
}

test('суммирует продажи партнёра через LEFT JOIN и SUM', () => {
  const { database, service } = createTestService();

  database.prepare(`
    INSERT INTO partners (id, name, email, phone, position, rating)
    VALUES (1, 'ООО "Альфа"', 'alpha@example.com', '+7 111 111 11 11', 'Директор', 10)
  `).run();
  database.prepare('INSERT INTO sales_history (id, partner_id, quantity) VALUES (1, 1, 30_000)').run();
  database.prepare('INSERT INTO sales_history (id, partner_id, quantity) VALUES (2, 1, 20_000)').run();

  assert.equal(service.getPartnerSalesVolume(1), 50_000);

  database.close();
});

test('возвращает партнёра с процентом скидки', () => {
  const { database, service } = createTestService();

  database.prepare(`
    INSERT INTO partners (id, name, email, phone, position, rating)
    VALUES (1, 'ИП Петров', 'petrov@example.com', '+7 222 222 22 22', 'Директор', 8)
  `).run();
  database.prepare('INSERT INTO sales_history (id, partner_id, quantity) VALUES (1, 1, 75_000)').run();

  const partner = service.getPartnerWithDiscount(1);

  assert.equal(partner.name, 'ИП Петров');
  assert.equal(partner.total_quantity, 75_000);
  assert.equal(partner.discount_percent, 10);

  database.close();
});

test('возвращает нулевой объём и нулевую скидку при отсутствии продаж', () => {
  const { database, service } = createTestService();

  database.prepare(`
    INSERT INTO partners (id, name, email, phone, position, rating)
    VALUES (1, 'ООО "Без продаж"', 'zero@example.com', '+7 333 333 33 33', 'Менеджер', 7)
  `).run();

  const partner = service.getPartnerWithDiscount(1);

  assert.equal(service.getPartnerSalesVolume(1), 0);
  assert.equal(partner.total_quantity, 0);
  assert.equal(partner.discount_percent, 0);

  database.close();
});
