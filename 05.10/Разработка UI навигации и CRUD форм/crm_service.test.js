const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { openCrmDatabase } = require('./crm_service');

function createTestDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-ui-'));
  const databasePath = path.join(directory, 'crm.db');
  const application = openCrmDatabase(databasePath);

  return { ...application, databasePath, directory };
}

function closeTestDatabase(testDatabase) {
  testDatabase.database.close();
  fs.rmSync(testDatabase.directory, { recursive: true, force: true });
}

test('создает и обновляет партнера, после чего список содержит актуальные данные', () => {
  const testDatabase = createTestDatabase();
  const createdPartner = testDatabase.service.createPartner({
    partnerName: 'Гамма',
    partnerType: 'ООО',
    rating: '4',
    address: 'г. Казань, ул. Тестовая, д. 1',
    director: 'Смирнов Сергей Сергеевич',
    phone: '+7 900 000-00-00',
    email: 'gamma@example.com',
  });
  const updatedPartner = testDatabase.service.updatePartner(createdPartner.partner_id, {
    partnerName: 'Гамма Плюс',
    partnerType: 'ПАО',
    rating: '8',
    address: 'г. Казань, ул. Тестовая, д. 2',
    director: 'Смирнов Сергей Сергеевич',
    phone: '+7 900 000-00-01',
    email: 'gamma@example.com',
  });

  assert.equal(updatedPartner.partner_name, 'Гамма Плюс');
  assert.equal(updatedPartner.rating, 8);
  assert.ok(testDatabase.service.listPartners().some((partner) => partner.partner_id === createdPartner.partner_id));

  closeTestDatabase(testDatabase);
});

test('возвращает историю продаж выбранного партнера', () => {
  const testDatabase = createTestDatabase();
  const history = testDatabase.service.getPartnerHistory(1);

  assert.deepEqual(history, [{ product_name: 'Ноутбук Pro', sale_date: '2023-10-25', quantity: 2 }]);

  closeTestDatabase(testDatabase);
});

test('очищает префиксы, повторные кавычки, лишние точки и пробелы из исходного CSV', () => {
  const testDatabase = createTestDatabase();
  const vector = testDatabase.service.getPartner(1);
  const petrov = testDatabase.service.getPartner(2);
  const techno = testDatabase.service.getPartner(3);
  const alpha = testDatabase.service.getPartner(4);

  assert.deepEqual([vector.partner_type, vector.partner_name], ['ООО', 'Вектор']);
  assert.deepEqual([petrov.partner_type, petrov.partner_name], ['ИП', 'Петров A.B.']);
  assert.deepEqual([techno.partner_type, techno.partner_name], ['АО', 'Технолоджис']);
  assert.deepEqual([alpha.partner_type, alpha.partner_name], ['ООО', 'Альфа']);

  closeTestDatabase(testDatabase);
});

test('сохраняет SQL-подобный текст как название и не выполняет его как запрос', () => {
  const testDatabase = createTestDatabase();
  const partnerName = "Тест'); DROP TABLE partners; --";
  const createdPartner = testDatabase.service.createPartner({
    partnerName,
    partnerType: 'ООО',
    rating: '0',
    address: 'г. Казань, ул. Тестовая, д. 1',
    director: 'Иванов Иван Иванович',
    phone: '+7 900 000-00-00',
    email: 'security-test@example.com',
  });

  assert.equal(createdPartner.partner_name, partnerName);
  assert.ok(testDatabase.service.listPartners().length > 1);

  closeTestDatabase(testDatabase);
});
