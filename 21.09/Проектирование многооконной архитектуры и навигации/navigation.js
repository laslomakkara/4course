class AppNavigation {
  constructor() {
    this.currentWindow = 'main';
  }

  openPartnerEditor() {
    this.currentWindow = 'editor';
  }

  returnToMainWindow() {
    this.currentWindow = 'main';
  }

  getWindowTitle() {
    if (this.currentWindow === 'editor') {
      return 'CRM: Карточка партнера [Редактирование]';
    }

    return 'CRM: Реестр партнеров';
  }
}

if (typeof module !== 'undefined') {
  module.exports = { AppNavigation };
}
