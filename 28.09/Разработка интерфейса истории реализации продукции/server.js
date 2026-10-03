const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { openPartnerDatabase } = require('./partner_service');

const publicDirectory = path.join(__dirname, 'public');

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Не удалось прочитать данные формы. Проверьте поля и повторите попытку.'));
      }
    });
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.js') return 'text/javascript; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
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

function createApplication(databasePath = path.join(__dirname, 'crm_history.db')) {
  const { database, service } = openPartnerDatabase(databasePath);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const partnerMatch = url.pathname.match(/^\/api\/partners\/(\d+)$/);
    const historyMatch = url.pathname.match(/^\/api\/partners\/(\d+)\/history$/);

    try {
      if (request.method === 'GET' && url.pathname === '/api/partner-types') return sendJson(response, 200, service.listPartnerTypes());
      if (request.method === 'GET' && url.pathname === '/api/partners') return sendJson(response, 200, service.listPartners());
      if (request.method === 'GET' && historyMatch) {
        const partnerId = Number(historyMatch[1]);
        const partner = service.getPartnerById(partnerId);
        return sendJson(response, partner ? 200 : 404, partner ? { partner, sales: service.getPartnerSalesHistory(partnerId) } : { error: 'Partner not found' });
      }
      if (request.method === 'GET' && partnerMatch) {
        const partner = service.getPartnerById(Number(partnerMatch[1]));
        return sendJson(response, partner ? 200 : 404, partner ?? { error: 'Partner not found' });
      }
      if (request.method === 'POST' && url.pathname === '/api/partners') return sendJson(response, 201, service.createPartner(await readJson(request)));
      if (request.method === 'PUT' && partnerMatch) {
        const partner = service.updatePartner(Number(partnerMatch[1]), await readJson(request));
        return sendJson(response, partner ? 200 : 404, partner ?? { error: 'Partner not found' });
      }
      return serveStaticFile(url.pathname, response);
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  });

  return { server, close() { database.close(); server.close(); } };
}

if (require.main === module) {
  const application = createApplication();
  application.server.listen(3005, () => console.log('Откройте http://localhost:3005'));
  process.on('SIGINT', () => application.close());
  process.on('SIGTERM', () => application.close());
}

module.exports = { createApplication };
