const fs = require('node:fs');
const path = require('node:path');

const logPath = path.join(__dirname, 'app.log');

function logError(message) {
  const timestamp = new Date().toLocaleString('ru-RU');
  const record = `${timestamp} Ошибка: ${message}\n`;

  fs.appendFileSync(logPath, record, 'utf8');
}

module.exports = { logError };
