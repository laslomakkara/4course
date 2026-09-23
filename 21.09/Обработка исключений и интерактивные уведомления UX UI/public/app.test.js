const test = require('node:test');
const assert = require('node:assert/strict');

global.document = undefined;

const { validatePartnerData } = require('./app');

test('сообщает об отсутствии наименования', () => {
  const error = validatePartnerData({ name: '', email: 'company@example.com', rating: '5' });

  assert.match(error, /Введите наименование/);
});

test('сообщает об отсутствии email', () => {
  const error = validatePartnerData({ name: 'Компания', email: '', rating: '5' });

  assert.match(error, /Введите email/);
});

test('не принимает дробный и отрицательный рейтинг', () => {
  assert.match(validatePartnerData({ name: 'Компания', email: 'company@example.com', rating: '1.5' }), /Рейтинг должен быть/);
  assert.match(validatePartnerData({ name: 'Компания', email: 'company@example.com', rating: '-1' }), /Рейтинг должен быть/);
});

test('принимает корректные данные', () => {
  const error = validatePartnerData({ name: 'Компания', email: 'company@example.com', rating: '0' });

  assert.equal(error, null);
});
