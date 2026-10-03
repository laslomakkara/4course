const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMaterialQuantity } = require('./material_calculator');

test('рассчитывает расход с коэффициентом продукции и браком материала', () => {
  const result = calculateMaterialQuantity(1, 2, 10, 2.5, 4);

  assert.equal(result, 126);
});

test('округляет дробный результат в большую сторону', () => {
  const result = calculateMaterialQuantity(2, 1, 1, 1.1, 1.1);

  assert.equal(result, 2);
});

test('возвращает -1 для несуществующих идентификаторов', () => {
  assert.equal(calculateMaterialQuantity(99, 1, 1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 99, 1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1.5, 1, 1, 1, 1), -1);
});

test('возвращает -1 для недопустимых параметров и количества', () => {
  assert.equal(calculateMaterialQuantity(1, 1, 0, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, -1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, 1.5, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, 1, 0, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, 1, 1, -1), -1);
});
