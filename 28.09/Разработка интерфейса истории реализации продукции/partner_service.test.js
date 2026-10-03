const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { createPartnerService } = require('./partner_service');

test('возвращает историю партнера через JOIN с продукцией и форматированной датой', () => {
  const database = new DatabaseSync(':memory:');
  const service = createPartnerService(database);

  service.initializeDatabase();
  database.prepare('INSERT INTO partner_types (id, name) VALUES (?, ?)').run(1, 'ООО');
  database.prepare(`
    INSERT INTO partners (id, name, partner_type_id, rating, address, director, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'Партнер', 1, 1, 'Адрес', 'Директор', '+7 000 000 00 00', 'partner@example.com');
  database.prepare('INSERT INTO products (id, name) VALUES (?, ?)').run(1, 'Панель МДФ');
  database.prepare('INSERT INTO sales_history (id, partner_id, product_id, quantity, sale_date) VALUES (?, ?, ?, ?, ?)').run(1, 1, 1, 250, '2026-09-28');

  const history = service.getPartnerSalesHistory(1);

  assert.deepEqual(history, [{ product_name: 'Панель МДФ', quantity: 250, sale_date: '28.09.2026' }]);

  database.close();
});

test('возвращает пустую историю для партнера без продаж', () => {
  const database = new DatabaseSync(':memory:');
  const service = createPartnerService(database);

  service.initializeDatabase();
  database.prepare('INSERT INTO partner_types (id, name) VALUES (?, ?)').run(1, 'ООО');
  database.prepare(`
    INSERT INTO partners (id, name, partner_type_id, rating, address, director, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'Без продаж', 1, 0, 'Адрес', 'Директор', '+7 000 000 00 00', 'empty@example.com');

  assert.deepEqual(service.getPartnerSalesHistory(1), []);

  database.close();
});
