const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { calculateMaterialQuantity } = require(path.join(
  __dirname,
  '..',
  'Разработка ядра алгоритма расчета материалов',
  'material_calculator',
));

const publicDirectory = path.join(__dirname, 'public');

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Не удалось прочитать значения формы.'));
      }
    });
  });
}

function parseNumber(value) {
  // Запятая поддерживается как десятичный разделитель для русскоязычного ввода.
  return Number(String(value).replace(',', '.'));
}

function getContentType(filePath) {
  const extension = path.extname(filePath);

  if (extension === '.js') {
    return 'text/javascript; charset=utf-8';
  }

  if (extension === '.css') {
    return 'text/css; charset=utf-8';
  }

  return 'text/html; charset=utf-8';
}

async function serveStaticFile(urlPath, response) {
  const requestedFile = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const filePath = path.resolve(publicDirectory, requestedFile);

  if (!filePath.startsWith(publicDirectory)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  try {
    response.writeHead(200, { 'Content-Type': getContentType(filePath) });
    response.end(await fs.readFile(filePath));
  } catch {
    sendJson(response, 404, { error: 'File not found' });
  }
}

function createApplication() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/material_calculator.js') {
      // Браузер получает тот же модуль расчета, который проверяется Node.js-тестами.
      const calculatorPath = path.join(
        __dirname,
        '..',
        'Разработка ядра алгоритма расчета материалов',
        'material_calculator.js',
      );

      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      response.end(await fs.readFile(calculatorPath));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/calculate-materials') {
      try {
        const values = await readJson(request);
        const materialQuantity = calculateMaterialQuantity(
          parseNumber(values.productTypeId),
          parseNumber(values.materialTypeId),
          parseNumber(values.quantity),
          parseNumber(values.param1),
          parseNumber(values.param2),
        );

        sendJson(response, 200, { materialQuantity });
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }

      return;
    }

    await serveStaticFile(url.pathname, response);
  });

  return server;
}

if (require.main === module) {
  const server = createApplication();

  server.listen(3010, () => {
    console.log('Откройте http://localhost:3010');
  });
}

module.exports = { createApplication };
