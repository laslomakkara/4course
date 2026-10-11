const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateMaterialQuantity,
  createBusinessDatabase,
  removeDatabase,
} = require(path.join(
  __dirname,
  '..',
  'Реализация ядра бизнес логики Расчеты и алгоритмы',
  'business_logic',
));

function createTestDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'material-tests-'));
  const databasePath = path.join(directory, 'business.db');
  const database = createBusinessDatabase(databasePath);

  return { database, databasePath, directory };
}

function closeTestDatabase(testDatabase) {
  testDatabase.database.close();
  removeDatabase(testDatabase.databasePath);
  fs.rmSync(testDatabase.directory, { recursive: true, force: true });
}

test('выполняет базовый расчет расхода материала', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 2, 10, 2.5, 4);

  assert.equal(result, 126);
  closeTestDatabase(testDatabase);
});

test('округляет дробный результат строго вверх', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 1, 1, 1, 1);

  assert.equal(result, 2);
  closeTestDatabase(testDatabase);
});

test('возвращает -1 для отсутствующего типа продукции', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 999, 1, 1, 1, 1);

  assert.equal(result, -1);
  closeTestDatabase(testDatabase);
});

test('возвращает -1 для отсутствующего типа материала', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 999, 1, 1, 1);

  assert.equal(result, -1);
  closeTestDatabase(testDatabase);
});

test('возвращает -1 для отрицательного параметра продукции', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 1, 1, -2, 1);

  assert.equal(result, -1);
  closeTestDatabase(testDatabase);
});

test('возвращает -1 при нулевом количестве продукции', () => {
  const testDatabase = createTestDatabase();
  const result = calculateMaterialQuantity(testDatabase.database, 1, 1, 0, 1, 1);

  assert.equal(result, -1);
  closeTestDatabase(testDatabase);
});
