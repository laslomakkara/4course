const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function decodeCsv(filePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1251').decode(buffer);
  }
}

function splitCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

function normalizeText(value) {
  let normalized = value.trim();

  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replaceAll('""', '"').trim();
}

function normalizeProductName(value) {
  return normalizeText(value).replace(/"$/, '').trim();
}

function normalizeDate(value) {
  const date = value.trim();
  const dayMonthYear = date.match(/^(\d{2})[.-](\d{2})[.-](\d{4})$/);
  const yearMonthDay = date.match(/^(\d{4})[./-](\d{2})[./-](\d{2})$/);

  if (dayMonthYear) {
    return `${dayMonthYear[3]}-${dayMonthYear[2]}-${dayMonthYear[1]}`;
  }

  if (yearMonthDay) {
    return `${yearMonthDay[1]}-${yearMonthDay[2]}-${yearMonthDay[3]}`;
  }

  throw new Error(`Неизвестный формат даты: ${value}`);
}

function readRows(filePath) {
  const lines = decodeCsv(filePath).trim().split(/\r?\n/);

  return lines.slice(1).map(splitCsvLine);
}

function runEtl(options = {}) {
  const dataDirectory = options.dataDirectory ?? path.join(__dirname, 'data', 'raw');
  const databasePath = options.databasePath ?? path.join(__dirname, 'clean_storage.db');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const partnerRows = readRows(path.join(dataDirectory, 'partners_raw.csv'));
  const productRows = readRows(path.join(dataDirectory, 'products_raw.csv'));
  const salesRows = readRows(path.join(dataDirectory, 'sales_history_raw.csv'));

  fs.rmSync(databasePath, { force: true });
  const database = new DatabaseSync(databasePath);

  database.exec(schema);
  const insertPartner = database.prepare('INSERT INTO partners (partner_id, partner_name, inn, email) VALUES (?, ?, ?, ?)');
  const insertProduct = database.prepare('INSERT INTO products (product_id, product_name, price) VALUES (?, ?, ?)');
  const insertSale = database.prepare('INSERT INTO sales_history (sale_id, partner_id, product_id, sale_date, quantity, amount) VALUES (?, ?, ?, ?, ?, ?)');
  const partnerIds = new Set();
  const productIds = new Set();
  let skippedSales = 0;

  database.exec('BEGIN');

  try {
    for (const [partnerId, partnerName, inn, email] of partnerRows) {
      const normalizedPartnerId = Number(partnerId);

      insertPartner.run(normalizedPartnerId, normalizeText(partnerName), inn.trim(), email.trim());
      partnerIds.add(normalizedPartnerId);
    }

    for (const [productId, productName, price] of productRows) {
      const normalizedProductId = Number(productId);

      insertProduct.run(normalizedProductId, normalizeProductName(productName), Number(price));
      productIds.add(normalizedProductId);
    }

    for (const [saleId, partnerId, productId, saleDate, quantity, amount] of salesRows) {
      const normalizedPartnerId = Number(partnerId);
      const normalizedProductId = Number(productId);

      if (!partnerIds.has(normalizedPartnerId) || !productIds.has(normalizedProductId)) {
        skippedSales += 1;
        continue;
      }

      insertSale.run(Number(saleId), normalizedPartnerId, normalizedProductId, normalizeDate(saleDate), Number(quantity), Number(amount));
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    database.close();
    throw error;
  }

  database.close();
  return { databasePath, importedPartners: partnerRows.length, importedProducts: productRows.length, importedSales: salesRows.length - skippedSales, skippedSales };
}

if (require.main === module) {
  const report = runEtl();

  console.log(`Партнеров импортировано: ${report.importedPartners}`);
  console.log(`Товаров импортировано: ${report.importedProducts}`);
  console.log(`Продаж импортировано: ${report.importedSales}`);
  console.log(`Продаж пропущено: ${report.skippedSales}`);
}

module.exports = { normalizeDate, normalizeProductName, normalizeText, runEtl };
