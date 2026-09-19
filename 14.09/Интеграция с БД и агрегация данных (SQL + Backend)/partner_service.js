const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { calculatePartnerDiscount } = require(path.join(
  __dirname,
  '..',
  'Разработка ядра бизнес-логики (Расчет скидки)',
  'calculate_partner_discount',
));

function createPartnerService(database) {
  function initializeDatabase() {
    database.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        position TEXT NOT NULL,
        rating INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales_history (
        id INTEGER PRIMARY KEY,
        partner_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (partner_id) REFERENCES partners(id)
      );
    `);
  }

  function seedDatabase() {
    const partnerCount = database.prepare('SELECT COUNT(*) AS count FROM partners').get();

    if (partnerCount.count > 0) {
      return;
    }

    const insertPartner = database.prepare(`
      INSERT INTO partners (id, name, email, phone, position, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSale = database.prepare(`
      INSERT INTO sales_history (id, partner_id, quantity)
      VALUES (?, ?, ?)
    `);

    database.transaction(() => {
      insertPartner.run(1, 'ООО "Тмыв денег"', 'tmyv@example.com', '+7 223 322 22 32', 'Директор', 10);
      insertPartner.run(2, 'ООО "Зарплата пришла"', 'salary@example.com', '+7 223 322 22 32', 'Директор', 9);
      insertPartner.run(3, 'ИП Павлюченко', 'pavlyuchenko@example.com', '+7 223 322 22 32', 'Директор', 8);
      insertPartner.run(4, 'ООО "Нулевой объём"', 'zero@example.com', '+7 223 322 22 32', 'Менеджер', 7);
      insertSale.run(1, 1, 50_000);
      insertSale.run(2, 2, 12_000);
      insertSale.run(3, 2, 3_000);
      insertSale.run(4, 3, 350_000);
    })();
  }

  function getPartnerSalesVolume(partnerId) {
    const row = database.prepare(`
      SELECT COALESCE(SUM(s.quantity), 0) AS total_quantity
      FROM partners AS p
      LEFT JOIN sales_history AS s ON s.partner_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(partnerId);

    return row ? row.total_quantity : null;
  }

  function getPartnerWithDiscount(partnerId) {
    const row = database.prepare(`
      SELECT
        p.id,
        p.name,
        p.email,
        p.phone,
        p.position,
        p.rating,
        COALESCE(SUM(s.quantity), 0) AS total_quantity
      FROM partners AS p
      LEFT JOIN sales_history AS s ON s.partner_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.email, p.phone, p.position, p.rating
    `).get(partnerId);

    if (!row) {
      return null;
    }

    return {
      ...row,
      discount_percent: calculatePartnerDiscount(row.total_quantity),
    };
  }

  function getAllPartnersWithDiscount() {
    const rows = database.prepare(`
      SELECT
        p.id,
        p.name,
        p.email,
        p.phone,
        p.position,
        p.rating,
        COALESCE(SUM(s.quantity), 0) AS total_quantity
      FROM partners AS p
      LEFT JOIN sales_history AS s ON s.partner_id = p.id
      GROUP BY p.id, p.name, p.email, p.phone, p.position, p.rating
      ORDER BY p.id
    `).all();

    return rows.map((partner) => ({
      ...partner,
      discount_percent: calculatePartnerDiscount(partner.total_quantity),
    }));
  }

  return {
    getAllPartnersWithDiscount,
    getPartnerSalesVolume,
    getPartnerWithDiscount,
    initializeDatabase,
    seedDatabase,
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
