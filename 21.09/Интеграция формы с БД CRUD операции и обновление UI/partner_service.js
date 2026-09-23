const { DatabaseSync } = require('node:sqlite');

function executeTransaction(database, callback) {
  database.exec('BEGIN');

  try {
    const result = callback();

    database.exec('COMMIT');

    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Поле «${fieldName}» обязательно.`);
  }

  return value.trim();
}

function requireRating(value) {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 0) {
    throw new Error('Рейтинг должен быть целым неотрицательным числом.');
  }

  return rating;
}

function createPartnerService(database) {
  function initializeDatabase() {
    database.exec('PRAGMA foreign_keys = ON');
    database.exec(`
      CREATE TABLE IF NOT EXISTS partner_types (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        partner_type_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 0),
        address TEXT NOT NULL,
        director TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        FOREIGN KEY (partner_type_id) REFERENCES partner_types(id)
      );
    `);
  }

  function seedDatabase() {
    const count = database.prepare('SELECT COUNT(*) AS count FROM partners').get().count;

    if (count > 0) {
      return;
    }

    const insertType = database.prepare('INSERT OR IGNORE INTO partner_types (name) VALUES (?)');
    const insertPartner = database.prepare(`
      INSERT INTO partners (name, partner_type_id, rating, address, director, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    executeTransaction(database, () => {
      ['ЗАО', 'ООО', 'ИП', 'ОАО', 'ПАО'].forEach((partnerType) => insertType.run(partnerType));
      insertPartner.run('Тмыв денег', getPartnerTypeId('ООО'), 10, 'г. Москва, ул. Пример, д. 1', 'Иванов Иван Иванович', '+7 223 322 22 32', 'tmyv@example.com');
      insertPartner.run('Зарплата пришла', getPartnerTypeId('ООО'), 5, 'г. Москва, ул. Деловая, д. 2', 'Петров Петр Петрович', '+7 223 322 22 33', 'salary@example.com');
      insertPartner.run('Павлюченко', getPartnerTypeId('ИП'), 8, 'г. Москва, ул. Новая, д. 3', 'Павлюченко Алексей Олегович', '+7 223 322 22 34', 'pavlyuchenko@example.com');
    });
  }

  function getPartnerTypeId(partnerType) {
    const row = database.prepare('SELECT id FROM partner_types WHERE name = ?').get(partnerType);

    if (!row) {
      throw new Error('Выберите тип партнера из списка.');
    }

    return row.id;
  }

  function normalizePartnerData(data) {
    return {
      name: requireText(data.name, 'Наименование'),
      partnerType: requireText(data.partnerType, 'Тип партнера'),
      rating: requireRating(data.rating),
      address: requireText(data.address, 'Адрес'),
      director: requireText(data.director, 'ФИО директора'),
      phone: requireText(data.phone, 'Телефон'),
      email: requireText(data.email, 'Email компании'),
    };
  }

  function getPartnerById(partnerId) {
    return database.prepare(`
      SELECT
        p.id,
        p.name,
        pt.name AS partnerType,
        p.rating,
        p.address,
        p.director,
        p.phone,
        p.email
      FROM partners AS p
      JOIN partner_types AS pt ON pt.id = p.partner_type_id
      WHERE p.id = ?
    `).get(partnerId) ?? null;
  }

  function listPartners() {
    return database.prepare(`
      SELECT
        p.id,
        p.name,
        pt.name AS partnerType,
        p.rating,
        p.address,
        p.director,
        p.phone,
        p.email
      FROM partners AS p
      JOIN partner_types AS pt ON pt.id = p.partner_type_id
      ORDER BY p.id
    `).all();
  }

  function listPartnerTypes() {
    return database.prepare('SELECT name FROM partner_types ORDER BY name').all().map((row) => row.name);
  }

  function createPartner(data) {
    const partner = normalizePartnerData(data);
    const partnerTypeId = getPartnerTypeId(partner.partnerType);
    const result = database.prepare(`
      INSERT INTO partners (name, partner_type_id, rating, address, director, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(partner.name, partnerTypeId, partner.rating, partner.address, partner.director, partner.phone, partner.email);

    return getPartnerById(Number(result.lastInsertRowid));
  }

  function updatePartner(partnerId, data) {
    if (!getPartnerById(partnerId)) {
      return null;
    }

    const partner = normalizePartnerData(data);
    const partnerTypeId = getPartnerTypeId(partner.partnerType);

    database.prepare(`
      UPDATE partners
      SET name = ?, partner_type_id = ?, rating = ?, address = ?, director = ?, phone = ?, email = ?
      WHERE id = ?
    `).run(partner.name, partnerTypeId, partner.rating, partner.address, partner.director, partner.phone, partner.email, partnerId);

    return getPartnerById(partnerId);
  }

  return {
    createPartner,
    getPartnerById,
    initializeDatabase,
    listPartnerTypes,
    listPartners,
    seedDatabase,
    updatePartner,
  };
}

function openPartnerDatabase(filePath) {
  const database = new DatabaseSync(filePath);
  const service = createPartnerService(database);

  service.initializeDatabase();
  service.seedDatabase();

  return { database, service };
}

module.exports = { createPartnerService, openPartnerDatabase };
