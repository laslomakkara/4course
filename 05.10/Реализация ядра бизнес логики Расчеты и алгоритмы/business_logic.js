const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { runEtl } = require(path.join(
  __dirname,
  '..',
  'Инфраструктура данных и ETL База данных в 3NF',
  'etl',
));

function calculatePartnerDiscount(database, partnerId) {
  const partner = database.prepare('SELECT partner_id FROM partners WHERE partner_id = ?').get(partnerId);

  if (!partner) {
    return -1;
  }

  const row = database.prepare('SELECT COALESCE(SUM(quantity), 0) AS total_quantity FROM sales_history WHERE partner_id = ?').get(partnerId);
  const totalQuantity = row.total_quantity;

  if (totalQuantity < 10000) {
    return 0;
  }

  if (totalQuantity < 50000) {
    return 5;
  }

  if (totalQuantity < 300000) {
    return 10;
  }

  return 15;
}

function calculateMaterialQuantity(database, productTypeId, materialTypeId, quantity, param1, param2) {
  const hasInvalidQuantity = !Number.isInteger(quantity) || quantity <= 0;
  const hasInvalidParam1 = !Number.isFinite(param1) || param1 <= 0;
  const hasInvalidParam2 = !Number.isFinite(param2) || param2 <= 0;

  if (!Number.isInteger(productTypeId) || !Number.isInteger(materialTypeId)) {
    return -1;
  }

  if (hasInvalidQuantity || hasInvalidParam1 || hasInvalidParam2) {
    return -1;
  }

  const productType = database.prepare('SELECT coefficient FROM product_types WHERE product_type_id = ?').get(productTypeId);
  const materialType = database.prepare('SELECT defect_rate FROM material_types WHERE material_type_id = ?').get(materialTypeId);

  if (!productType || !materialType) {
    return -1;
  }

  const materialQuantity = quantity * param1 * param2 * productType.coefficient * (1 + materialType.defect_rate / 100);

  // Округление вверх создаёт запас материала, достаточный для целого числа изделий.
  return Math.ceil(materialQuantity);
}

function createBusinessDatabase(databasePath) {
  runEtl({ databasePath });
  const database = new DatabaseSync(databasePath);

  database.exec('PRAGMA foreign_keys = ON');
  database.exec(`
    CREATE TABLE product_types (
      product_type_id INTEGER PRIMARY KEY,
      type_name TEXT NOT NULL UNIQUE,
      coefficient DECIMAL(8, 3) NOT NULL CHECK (coefficient > 0)
    );

    CREATE TABLE material_types (
      material_type_id INTEGER PRIMARY KEY,
      type_name TEXT NOT NULL UNIQUE,
      defect_rate DECIMAL(5, 2) NOT NULL CHECK (defect_rate >= 0)
    );
  `);

  const insertProductType = database.prepare('INSERT INTO product_types (product_type_id, type_name, coefficient) VALUES (?, ?, ?)');
  const insertMaterialType = database.prepare('INSERT INTO material_types (material_type_id, type_name, defect_rate) VALUES (?, ?, ?)');

  insertProductType.run(1, 'Стандартный', 1.2);
  insertProductType.run(2, 'Усиленный', 1.5);
  insertProductType.run(3, 'Премиум', 2);
  insertMaterialType.run(1, 'Основной', 2.5);
  insertMaterialType.run(2, 'Повышенный брак', 5);
  insertMaterialType.run(3, 'Особый материал', 7.5);

  return database;
}

function removeDatabase(databasePath) {
  if (fs.existsSync(databasePath)) {
    fs.rmSync(databasePath);
  }
}

module.exports = {
  calculateMaterialQuantity,
  calculatePartnerDiscount,
  createBusinessDatabase,
  removeDatabase,
};
