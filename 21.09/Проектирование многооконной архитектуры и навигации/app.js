const navigation = new AppNavigation();
const mainWindow = document.querySelector('#main-window');
const partnerEditWindow = document.querySelector('#partner-edit-window');
const addPartnerButton = document.querySelector('#add-partner-button');
const backButton = document.querySelector('#back-button');

function renderCurrentWindow() {
  const isEditorOpen = navigation.currentWindow === 'editor';

  mainWindow.hidden = isEditorOpen;
  partnerEditWindow.hidden = !isEditorOpen;
  document.title = navigation.getWindowTitle();
}

addPartnerButton.addEventListener('click', () => {
  navigation.openPartnerEditor();
  renderCurrentWindow();
});

backButton.addEventListener('click', () => {
  navigation.returnToMainWindow();
  renderCurrentWindow();
});

renderCurrentWindow();
