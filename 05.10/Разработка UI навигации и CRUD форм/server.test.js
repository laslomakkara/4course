const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplication } = require('./server');

test('API сохраняет нового партнера и возвращает его в реестре', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-api-'));
  const databasePath = path.join(directory, 'crm.db');
  const application = createApplication(databasePath);

  await new Promise((resolve) => application.server.listen(0, resolve));
  const { port } = application.server.address();
  const response = await fetch(`http://localhost:${port}/api/partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerName: 'Дельта',
      partnerType: 'ИП',
      rating: 3,
      address: 'г. Омск, ул. Новая, д. 1',
      director: 'Орлов Олег Олегович',
      phone: '+7 900 000-00-02',
      email: 'delta@example.com',
    }),
  });
  const createdPartner = await response.json();
  const listResponse = await fetch(`http://localhost:${port}/api/partners`);
  const partners = await listResponse.json();

  assert.equal(response.status, 201);
  assert.equal(createdPartner.partner_name, 'Дельта');
  assert.ok(partners.some((partner) => partner.partner_id === createdPartner.partner_id));

  await new Promise((resolve) => application.server.close(resolve));
  application.database.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
