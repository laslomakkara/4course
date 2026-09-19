const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { executeTransaction, openPartnerDatabase } = require(path.join(
  __dirname,
  '..',
  'Интеграция с БД и агрегация данных (SQL + Backend)',
  'partner_service',
));

const publicDirectory = path.join(__dirname, 'public');

function addStressPartners(database) {
  const partnerCount = database.prepare('SELECT COUNT(*) AS count FROM partners').get();

  if (partnerCount.count >= 100) {
    return;
  }

  const insertPartner = database.prepare(`
    INSERT OR IGNORE INTO partners (id, name, email, phone, position, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertSale = database.prepare(`
    INSERT OR IGNORE INTO sales_history (id, partner_id, quantity)
    VALUES (?, ?, ?)
  `);

  executeTransaction(database, () => {
    for (let partnerId = 5; partnerId <= 100; partnerId += 1) {
      const quantity = (partnerId * 12_500) % 500_000;

      insertPartner.run(
        partnerId,
        `ООО "Компания ${partnerId}"`,
        `company${partnerId}@example.com`,
        `+7 900 ${String(partnerId).padStart(3, '0')} 00 00`,
        'Менеджер',
        5 + (partnerId % 6),
      );
      insertSale.run(partnerId + 100, partnerId, quantity);
    }
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function getContentType(filePath) {
  const extension = path.extname(filePath);
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
  };

  return contentTypes[extension] ?? 'application/octet-stream';
}

async function serveStaticFile(urlPath, response) {
  const requestedFile = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const filePath = path.resolve(publicDirectory, requestedFile);

  if (!filePath.startsWith(publicDirectory)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const fileContent = await fs.readFile(filePath);

    response.writeHead(200, { 'Content-Type': getContentType(filePath) });
    response.end(fileContent);
  } catch {
    sendJson(response, 404, { error: 'File not found' });
  }
}

function createApplication({ databasePath = path.join(__dirname, 'partners.db'), stressTest = false } = {}) {
  const { database, service } = openPartnerDatabase(databasePath);

  if (stressTest) {
    addStressPartners(database);
  }

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/api/partners') {
      sendJson(response, 200, service.getAllPartnersWithDiscount());
      return;
    }

    await serveStaticFile(url.pathname, response);
  });

  function close() {
    database.close();
    server.close();
  }

  return { close, server, service };
}

if (require.main === module) {
  const stressTest = process.argv.includes('--stress');
  const application = createApplication({ stressTest });

  application.server.listen(3001, () => {
    const mode = stressTest ? 'Стресс-тест: 100 партнёров' : 'Демонстрационный режим: 4 партнёра';

    console.log(`${mode}. Откройте http://localhost:3001`);
  });

  process.on('SIGINT', application.close);
  process.on('SIGTERM', application.close);
}

module.exports = { createApplication };
