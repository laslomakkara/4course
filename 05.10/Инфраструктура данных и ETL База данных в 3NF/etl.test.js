const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { normalizeDate, normalizePartnerName, runEtl } = require('./etl');

test('нормализует все форматы дат к ГГГГ-ММ-ДД', () => {
  assert.equal(normalizeDate('25.10.2023'), '2023-10-25');
  assert.equal(normalizeDate('2023/10/26'), '2023-10-26');
  assert.equal(normalizeDate('28-10-2023'), '2023-10-28');
  assert.equal(normalizeDate('2023.10.29'), '2023-10-29');
});

test('очищает лишние разделители после типа партнера, сохраняя точки инициалов', () => {
  assert.equal(normalizePartnerName('ИП ...Петров  A.B.'), 'ИП Петров A.B.');
  assert.equal(normalizePartnerName(' ООО ""Вектор"" '), 'ООО "Вектор"');
});

test('очищает данные и пропускает продажу с отсутствующим партнером', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'etl-test-'));
  const databasePath = path.join(temporaryDirectory, 'storage.db');
  const report = runEtl({ databasePath });
  const database = new DatabaseSync(databasePath);
  const partner = database.prepare('SELECT partner_name, email FROM partners WHERE partner_id = ?').get(1);
  const petrov = database.prepare('SELECT partner_name FROM partners WHERE partner_id = ?').get(2);
  const dates = database.prepare('SELECT sale_date FROM sales_history ORDER BY sale_id').all().map((row) => row.sale_date);
  const salesCount = database.prepare('SELECT COUNT(*) AS count FROM sales_history').get().count;

  assert.equal(report.skippedSales, 1);
  assert.equal(salesCount, 5);
  assert.deepEqual({ ...partner }, { partner_name: 'ООО "Вектор"', email: 'vector@mail.ru' });
  assert.equal(petrov.partner_name, 'ИП Петров A.B.');
  assert.deepEqual(dates, ['2023-10-25', '2023-10-26', '2023-10-28', '2023-10-29', '2023-10-30']);

  database.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});
