const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { createPartnerService } = require('./partner_service');

function createTestService() {
  const database = new DatabaseSync(':memory:');
  const service = createPartnerService(database);

  service.initializeDatabase();
  database.prepare('INSERT INTO partner_types (name) VALUES (?)').run('ООО');
  database.prepare('INSERT INTO partner_types (name) VALUES (?)').run('ИП');

  return { database, service };
}

const newPartner = {
  name: 'Новая компания',
  partnerType: 'ООО',
  rating: 4,
  address: 'г. Москва, ул. Новая, д. 1',
  director: 'Смирнов Сергей Сергеевич',
  phone: '+7 900 000-00-00',
  email: 'new@example.com',
};

test('создаёт партнера и сохраняет связь с типом партнера', () => {
  const { database, service } = createTestService();
  const partner = service.createPartner(newPartner);

  assert.equal(partner.id, 1);
  assert.equal(partner.partnerType, 'ООО');
  assert.equal(service.listPartners().length, 1);

  database.close();
});

test('обновляет существующего партнера', () => {
  const { database, service } = createTestService();
  const partner = service.createPartner(newPartner);
  const updatedPartner = service.updatePartner(partner.id, {
    ...newPartner,
    partnerType: 'ИП',
    rating: 9,
  });

  assert.equal(updatedPartner.partnerType, 'ИП');
  assert.equal(updatedPartner.rating, 9);

  database.close();
});

test('не сохраняет партнера с несуществующим типом', () => {
  const { database, service } = createTestService();

  assert.throws(() => service.createPartner({ ...newPartner, partnerType: 'Неизвестный тип' }), /Выберите тип партнера/);
  assert.equal(service.listPartners().length, 0);

  database.close();
});
