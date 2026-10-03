const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMaterialQuantity } = require('../Разработка ядра алгоритма расчета материалов/material_calculator');

test('обычный расчет возвращает известный результат', () => {
  const result = calculateMaterialQuantity(1, 2, 10, 2.5, 4);

  assert.equal(result, 126);
});

test('дробный расход округляется в большую сторону', () => {
  const result = calculateMaterialQuantity(2, 1, 1, 1.1, 1.1);

  assert.equal(result, 2);
});

test('несуществующие типы продукции и материала возвращают -1', () => {
  assert.equal(calculateMaterialQuantity(99, 1, 1, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 99, 1, 1, 1), -1);
});

test('отрицательные размеры возвращают -1', () => {
  assert.equal(calculateMaterialQuantity(1, 1, 1, -1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, 1, 1, -1), -1);
});

test('нулевое и отрицательное количество возвращают -1', () => {
  assert.equal(calculateMaterialQuantity(1, 1, 0, 1, 1), -1);
  assert.equal(calculateMaterialQuantity(1, 1, -1, 1, 1), -1);
});
