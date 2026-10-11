const messageBox = document.querySelector('#message-box');
const messageBoxIcon = document.querySelector('#message-box-icon');
const messageBoxTitle = document.querySelector('#message-box-title');
const messageBoxText = document.querySelector('#message-box-text');
const messageBoxCancel = document.querySelector('#message-box-cancel');
const messageBoxConfirm = document.querySelector('#message-box-confirm');

function showMessageBox(options) {
  const icons = { error: '×', warning: '!', information: 'i' };

  messageBox.className = `message-box message-box--${options.type}`;
  messageBoxIcon.textContent = icons[options.type];
  messageBoxTitle.textContent = options.title;
  messageBoxText.textContent = options.text;
  messageBoxCancel.hidden = !options.cancelText;
  messageBoxCancel.textContent = options.cancelText ?? '';
  messageBoxConfirm.textContent = options.confirmText ?? 'Понятно';
  messageBox.returnValue = '';

  return new Promise((resolve) => {
    // Переход выполняется после закрытия окна, чтобы пользователь успел прочитать сообщение.
    messageBox.addEventListener('close', () => resolve(messageBox.returnValue === 'confirm'), { once: true });
    messageBoxConfirm.onclick = () => messageBox.close('confirm');
    messageBoxCancel.onclick = () => messageBox.close('cancel');
    messageBox.showModal();
  });
}
