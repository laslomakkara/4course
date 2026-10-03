const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMaterialQuantity } = require('../Разработка ядра алгоритма расчета материалов/material_calculator');
const { createApplication } = require('./server');

test('метод передает в интерфейс положительный результат расчета', () => {
  assert.equal(calculateMaterialQuantity(1, 2, 10, 2.5, 4), 126);
});

test('метод возвращает -1, который интерфейс использует для сообщения об ошибке', () => {
  assert.equal(calculateMaterialQuantity(99, 1, 10, 2.5, 4), -1);
  assert.equal(calculateMaterialQuantity(1, 1, 10, -2.5, 4), -1);
});

test('сервер понимает дробный параметр с запятой', async () => {
  const server = createApplication();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const response = await fetch(`http://localhost:${port}/api/calculate-materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productTypeId: '1', materialTypeId: '2', quantity: '10', param1: '2,5', param2: '4' }),
  });

  assert.deepEqual(await response.json(), { materialQuantity: 126 });
  await new Promise((resolve) => server.close(resolve));
});
