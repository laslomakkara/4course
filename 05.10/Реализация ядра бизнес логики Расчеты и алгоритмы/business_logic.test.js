const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateMaterialQuantity,
  calculatePartnerDiscount,
  createBusinessDatabase,
  removeDatabase,
} = require('./business_logic');

function createTestDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'business-logic-'));
  const databasePath = path.join(directory, 'business.db');
  const database = createBusinessDatabase(databasePath);

  return { database, databasePath, directory };
}

function setPartnerSalesQuantity(database, quantity) {
  database.exec('DELETE FROM sales_history');
  database.prepare('INSERT INTO sales_history (sale_id, partner_id, product_id, sale_date, quantity, amount) VALUES (?, ?, ?, ?, ?, ?)').run(1, 1, 101, '2023-10-30', quantity, 0);
}

function closeTestDatabase(testDatabase) {
  testDatabase.database.close();
  removeDatabase(testDatabase.databasePath);
  fs.rmSync(testDatabase.directory, { recursive: true, force: true });
}

test('рассчитывает скидки на границах диапазонов по сумме продаж из БД', () => {
  const testDatabase = createTestDatabase();

  setPartnerSalesQuantity(testDatabase.database, 9999);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 0);
  setPartnerSalesQuantity(testDatabase.database, 10000);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 5);
  setPartnerSalesQuantity(testDatabase.database, 49999);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 5);
  setPartnerSalesQuantity(testDatabase.database, 50000);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 10);
  setPartnerSalesQuantity(testDatabase.database, 299999);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 10);
  setPartnerSalesQuantity(testDatabase.database, 300000);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 15);

  closeTestDatabase(testDatabase);
});

test('возвращает скидку 0 при отсутствии продаж и -1 для неизвестного партнера', () => {
  const testDatabase = createTestDatabase();

  testDatabase.database.exec('DELETE FROM sales_history');
  assert.equal(calculatePartnerDiscount(testDatabase.database, 1), 0);
  assert.equal(calculatePartnerDiscount(testDatabase.database, 999), -1);

  closeTestDatabase(testDatabase);
});

test('рассчитывает расход материала через справочники в БД', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 2, 10, 2.5, 4);

  assert.equal(result, 126);
  closeTestDatabase(testDatabase);
});

test('возвращает -1 для отсутствующих типов и неверных параметров', () => {
  const testDatabase = createTestDatabase();

  assert.equal(calculateMaterialQuantity(testDatabase.database, 99, 1, 1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(testDatabase.database, 1, 99, 1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(testDatabase.database, 1, 1, 0, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(testDatabase.database, 1, 1, 1, -1, 1), -1);

  closeTestDatabase(testDatabase);
});
