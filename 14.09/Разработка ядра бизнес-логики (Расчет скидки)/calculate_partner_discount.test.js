const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePartnerDiscount } = require('./calculate_partner_discount');

test('возвращает 0% для объёма 9 999', () => {
  assert.equal(calculatePartnerDiscount(9_999), 0);
});

test('возвращает 5% для объёма 10 000', () => {
  assert.equal(calculatePartnerDiscount(10_000), 5);
});

test('возвращает 5% для объёма 49 999', () => {
  assert.equal(calculatePartnerDiscount(49_999), 5);
});

test('возвращает 10% для объёма 50 000', () => {
  assert.equal(calculatePartnerDiscount(50_000), 10);
});

test('возвращает 15% для объёма 300 000', () => {
  assert.equal(calculatePartnerDiscount(300_000), 15);
});
