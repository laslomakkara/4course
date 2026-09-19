const http = require('node:http');
const path = require('node:path');
const { openPartnerDatabase } = require('./partner_service');

const port = 3000;
const databasePath = path.join(__dirname, 'partners.db');
const { database, service } = openPartnerDatabase(databasePath);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/api/partners') {
    sendJson(response, 200, service.getAllPartnersWithDiscount());
    return;
  }

  const partnerMatch = url.pathname.match(/^\/api\/partners\/(\d+)$/);

  if (request.method === 'GET' && partnerMatch) {
    const partner = service.getPartnerWithDiscount(Number(partnerMatch[1]));

    if (partner) {
      sendJson(response, 200, partner);
      return;
    }

    sendJson(response, 404, { error: 'Partner not found' });
    return;
  }

  sendJson(response, 404, { error: 'Route not found' });
});

server.listen(port, () => {
  console.log(`Partner API is running at http://localhost:${port}`);
});

function closeServer() {
  database.close();
  server.close();
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
