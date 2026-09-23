const test = require('node:test');
const assert = require('node:assert/strict');
const { getPartnerMode, partnerTypes } = require('./partner_form');

test('открывает форму добавления без идентификатора партнера', () => {
  const mode = getPartnerMode('');

  assert.equal(mode.partnerId, null);
  assert.equal(mode.title, 'CRM: Карточка партнера [Добавление]');
});

test('открывает форму редактирования с идентификатором партнера', () => {
  const mode = getPartnerMode('?partnerId=14');

  assert.equal(mode.partnerId, '14');
  assert.equal(mode.title, 'CRM: Карточка партнера [Редактирование]');
});

test('содержит варианты для выпадающего списка типов партнеров', () => {
  assert.deepEqual(partnerTypes, ['ЗАО', 'ООО', 'ИП', 'ОАО', 'ПАО']);
});
