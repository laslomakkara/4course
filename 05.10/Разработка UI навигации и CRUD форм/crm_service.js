const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { runEtl } = require(path.join(
  __dirname,
  '..',
  'Инфраструктура данных и ETL База данных в 3NF',
  'etl',
));

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

function addColumnIfMissing(database, columnName, statement) {
  const columns = database.prepare('PRAGMA table_info(partners)').all();
  const columnExists = columns.some((column) => column.name === columnName);

  if (!columnExists) {
    database.exec(statement);
  }
}

function cleanImportedPartnerName(partnerName) {
  return partnerName
    .trim()
    .replace(/^(ООО|ИП|АО)\s+/u, '')
    .replace(/^[\s.,;:]+/u, '')
    .replace(/^["«]+|["»]+$/gu, '')
    .replace(/\s{2,}/gu, ' ')
    .replace(/^[\s,;:]+|[\s,;:]+$/gu, '')
    .trim();
}

function initializeCrmSchema(database) {
  // Базовые партнёры поступают из ETL, поэтому поля CRM добавляются миграцией.
  addColumnIfMissing(database, 'partner_type', "ALTER TABLE partners ADD COLUMN partner_type TEXT NOT NULL DEFAULT 'ООО'");
  addColumnIfMissing(database, 'rating', 'ALTER TABLE partners ADD COLUMN rating INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(database, 'address', "ALTER TABLE partners ADD COLUMN address TEXT NOT NULL DEFAULT 'Не указан'");
  addColumnIfMissing(database, 'director', "ALTER TABLE partners ADD COLUMN director TEXT NOT NULL DEFAULT 'Не указан'");
  addColumnIfMissing(database, 'phone', "ALTER TABLE partners ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  const importedPartners = database.prepare("SELECT partner_id, partner_name FROM partners WHERE partner_name LIKE 'ООО %' OR partner_name LIKE 'ИП %' OR partner_name LIKE 'АО %'").all();
  const updateImportedPartner = database.prepare('UPDATE partners SET partner_type = ?, partner_name = ? WHERE partner_id = ?');

  // Тип и название разделяются один раз при переносе необработанных данных в CRM.
  for (const partner of importedPartners) {
    const partnerType = partner.partner_name.trim().split(/\s+/u)[0];
    const partnerName = cleanImportedPartnerName(partner.partner_name);
    updateImportedPartner.run(partnerType, partnerName, partner.partner_id);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS partner_types (
      type_name TEXT PRIMARY KEY
    );
  `);

  const insertType = database.prepare('INSERT OR IGNORE INTO partner_types (type_name) VALUES (?)');

  ['ЗАО', 'ООО', 'ИП', 'АО', 'ОАО', 'ПАО'].forEach((typeName) => insertType.run(typeName));
}

function normalizePartner(data) {
  return {
    partnerName: requireText(data.partnerName, 'Наименование'),
    partnerType: requireText(data.partnerType, 'Тип партнера'),
    rating: requireRating(data.rating),
    address: requireText(data.address, 'Адрес'),
    director: requireText(data.director, 'Директор'),
    phone: requireText(data.phone, 'Телефон'),
    email: requireText(data.email, 'Email'),
  };
}

function createCrmService(database) {
  function listPartners() {
    return database.prepare(`
      SELECT partner_id, partner_name, partner_type, rating, address, director, phone, email
      FROM partners
      ORDER BY partner_id
    `).all().map((row) => ({ ...row }));
  }

  function getPartner(partnerId) {
    const partner = database.prepare(`
      SELECT partner_id, partner_name, partner_type, rating, address, director, phone, email
      FROM partners
      WHERE partner_id = ?
    `).get(partnerId);

    return partner ? { ...partner } : null;
  }

  function listPartnerTypes() {
    return database.prepare('SELECT type_name FROM partner_types ORDER BY type_name').all().map((row) => row.type_name);
  }

  function createPartner(data) {
    const partner = normalizePartner(data);
    const nextId = database.prepare('SELECT COALESCE(MAX(partner_id), 0) + 1 AS next_id FROM partners').get().next_id;
    const generatedInn = String(9000000000 + nextId);

    database.prepare(`
      INSERT INTO partners (partner_id, partner_name, inn, email, partner_type, rating, address, director, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nextId, partner.partnerName, generatedInn, partner.email, partner.partnerType, partner.rating, partner.address, partner.director, partner.phone);

    return getPartner(nextId);
  }

  function updatePartner(partnerId, data) {
    if (!getPartner(partnerId)) {
      return null;
    }

    const partner = normalizePartner(data);

    database.prepare(`
      UPDATE partners
      SET partner_name = ?, email = ?, partner_type = ?, rating = ?, address = ?, director = ?, phone = ?
      WHERE partner_id = ?
    `).run(partner.partnerName, partner.email, partner.partnerType, partner.rating, partner.address, partner.director, partner.phone, partnerId);

    return getPartner(partnerId);
  }

  function getPartnerHistory(partnerId) {
    return database.prepare(`
      SELECT pr.product_name, sh.sale_date, sh.quantity
      FROM sales_history AS sh
      JOIN products AS pr ON pr.product_id = sh.product_id
      WHERE sh.partner_id = ?
      ORDER BY sh.sale_date DESC
    `).all(partnerId).map((row) => ({ ...row }));
  }

  return { createPartner, getPartner, getPartnerHistory, listPartnerTypes, listPartners, updatePartner };
}

function openCrmDatabase(databasePath = path.join(__dirname, 'crm.db')) {
  if (!fs.existsSync(databasePath)) {
    runEtl({ databasePath });
  }

  const database = new DatabaseSync(databasePath);

  database.exec('PRAGMA foreign_keys = ON');
  initializeCrmSchema(database);
  return { database, service: createCrmService(database) };
}

module.exports = { createCrmService, openCrmDatabase };
