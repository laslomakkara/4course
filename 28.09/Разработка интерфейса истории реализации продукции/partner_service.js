const { DatabaseSync } = require('node:sqlite');

function runTransaction(database, callback) {
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

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales_history (
        id INTEGER PRIMARY KEY,
        partner_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        sale_date TEXT NOT NULL,
        FOREIGN KEY (partner_id) REFERENCES partners(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
  }

  function getPartnerTypeId(partnerType) {
    const row = database.prepare('SELECT id FROM partner_types WHERE name = ?').get(partnerType);

    if (!row) {
      throw new Error('Выберите тип партнера из списка.');
    }

    return row.id;
  }

  function seedDatabase() {
    const partnerCount = database.prepare('SELECT COUNT(*) AS count FROM partners').get().count;

    if (partnerCount === 0) {
      const insertType = database.prepare('INSERT OR IGNORE INTO partner_types (name) VALUES (?)');
      const insertPartner = database.prepare(`
        INSERT INTO partners (name, partner_type_id, rating, address, director, phone, email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      runTransaction(database, () => {
        ['ЗАО', 'ООО', 'ИП', 'ОАО', 'ПАО'].forEach((type) => insertType.run(type));
        insertPartner.run('Тмыв денег', getPartnerTypeId('ООО'), 10, 'г. Москва, ул. Пример, д. 1', 'Иванов Иван Иванович', '+7 223 322 22 32', 'tmyv@example.com');
        insertPartner.run('Зарплата пришла', getPartnerTypeId('ООО'), 5, 'г. Москва, ул. Деловая, д. 2', 'Петров Петр Петрович', '+7 223 322 22 33', 'salary@example.com');
        insertPartner.run('Павлюченко', getPartnerTypeId('ИП'), 8, 'г. Москва, ул. Новая, д. 3', 'Павлюченко Алексей Олегович', '+7 223 322 22 34', 'pavlyuchenko@example.com');
      });
    }

    const saleCount = database.prepare('SELECT COUNT(*) AS count FROM sales_history').get().count;

    if (saleCount === 0) {
      const insertProduct = database.prepare('INSERT INTO products (id, name) VALUES (?, ?)');
      const insertSale = database.prepare('INSERT INTO sales_history (partner_id, product_id, quantity, sale_date) VALUES (?, ?, ?, ?)');

      runTransaction(database, () => {
        insertProduct.run(1, 'Лист ДВП 2440×1220 мм');
        insertProduct.run(2, 'Панель МДФ белая');
        insertProduct.run(3, 'Фанера берёзовая 12 мм');
        insertSale.run(1, 1, 12500, '2026-09-02');
        insertSale.run(1, 2, 4200, '2026-09-14');
        insertSale.run(1, 3, 850, '2026-09-27');
        insertSale.run(2, 2, 3500, '2026-09-19');
        insertSale.run(3, 1, 1100, '2026-09-25');
      });
    }
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
    const row = database.prepare(`
      SELECT p.id, p.name, pt.name AS partnerType, p.rating, p.address, p.director, p.phone, p.email
      FROM partners AS p JOIN partner_types AS pt ON pt.id = p.partner_type_id WHERE p.id = ?
    `).get(partnerId);

    return row ? { ...row } : null;
  }

  function listPartners() {
    return database.prepare(`
      SELECT p.id, p.name, pt.name AS partnerType, p.rating, p.address, p.director, p.phone, p.email
      FROM partners AS p JOIN partner_types AS pt ON pt.id = p.partner_type_id ORDER BY p.id
    `).all().map((row) => ({ ...row }));
  }

  function listPartnerTypes() {
    return database.prepare('SELECT name FROM partner_types ORDER BY name').all().map((row) => row.name);
  }

  function createPartner(data) {
    const partner = normalizePartnerData(data);
    const result = database.prepare(`
      INSERT INTO partners (name, partner_type_id, rating, address, director, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(partner.name, getPartnerTypeId(partner.partnerType), partner.rating, partner.address, partner.director, partner.phone, partner.email);

    return getPartnerById(Number(result.lastInsertRowid));
  }

  function updatePartner(partnerId, data) {
    if (!getPartnerById(partnerId)) return null;
    const partner = normalizePartnerData(data);

    database.prepare(`
      UPDATE partners SET name = ?, partner_type_id = ?, rating = ?, address = ?, director = ?, phone = ?, email = ?
      WHERE id = ?
    `).run(partner.name, getPartnerTypeId(partner.partnerType), partner.rating, partner.address, partner.director, partner.phone, partner.email, partnerId);

    return getPartnerById(partnerId);
  }

  function getPartnerSalesHistory(partnerId) {
    return database.prepare(`
      SELECT pr.name AS product_name, sh.quantity, strftime('%d.%m.%Y', sh.sale_date) AS sale_date
      FROM sales_history AS sh
      JOIN partners AS p ON p.id = sh.partner_id
      JOIN products AS pr ON pr.id = sh.product_id
      WHERE p.id = ?
      ORDER BY sh.sale_date DESC
    `).all(partnerId).map((row) => ({ ...row }));
  }

  return { createPartner, getPartnerById, getPartnerSalesHistory, initializeDatabase, listPartnerTypes, listPartners, seedDatabase, updatePartner };
}

function openPartnerDatabase(filePath) {
  const database = new DatabaseSync(filePath);
  const service = createPartnerService(database);
  service.initializeDatabase();
  service.seedDatabase();
  return { database, service };
}

module.exports = { createPartnerService, openPartnerDatabase };
