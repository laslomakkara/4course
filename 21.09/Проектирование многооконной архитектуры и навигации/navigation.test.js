const test = require('node:test');
const assert = require('node:assert/strict');
const { AppNavigation } = require('./navigation');

test('открывает PartnerEditWindow с уникальным заголовком', () => {
  const navigation = new AppNavigation();

  navigation.openPartnerEditor();

  assert.equal(navigation.currentWindow, 'editor');
  assert.equal(navigation.getWindowTitle(), 'CRM: Карточка партнера [Редактирование]');
});

test('возвращает пользователя из PartnerEditWindow в MainWindow', () => {
  const navigation = new AppNavigation();

  navigation.openPartnerEditor();
  navigation.returnToMainWindow();

  assert.equal(navigation.currentWindow, 'main');
  assert.equal(navigation.getWindowTitle(), 'CRM: Реестр партнеров');
});
