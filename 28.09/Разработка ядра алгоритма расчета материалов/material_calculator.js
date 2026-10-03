const productTypeCoefficients = new Map([
  [1, 1.2],
  [2, 1.5],
  [3, 2],
]);

const materialTypeDefectRates = new Map([
  [1, 2.5],
  [2, 5],
  [3, 7.5],
]);

function calculateMaterialQuantity(productTypeId, materialTypeId, quantity, param1, param2) {
  if (!Number.isInteger(productTypeId) || !Number.isInteger(materialTypeId)) {
    return -1;
  }

  const hasInvalidQuantity = !Number.isInteger(quantity) || quantity <= 0;
  const hasInvalidParam1 = !Number.isFinite(param1) || param1 <= 0;
  const hasInvalidParam2 = !Number.isFinite(param2) || param2 <= 0;

  if (hasInvalidQuantity || hasInvalidParam1 || hasInvalidParam2) {
    return -1;
  }

  const productCoefficient = productTypeCoefficients.get(productTypeId);
  const defectRate = materialTypeDefectRates.get(materialTypeId);

  if (productCoefficient === undefined || defectRate === undefined) {
    return -1;
  }

  // param1 и param2 задают размеры изделия, например длину и ширину.
  const baseMaterialQuantity = param1 * param2 * productCoefficient;
  const netMaterialQuantity = baseMaterialQuantity * quantity;
  const materialWithDefect = netMaterialQuantity * (1 + defectRate / 100);

  return Math.ceil(materialWithDefect);
}

// Один модуль используется и в Node.js-тестах, и в браузерной форме.
if (typeof module !== 'undefined') {
  module.exports = {
    calculateMaterialQuantity,
    materialTypeDefectRates,
    productTypeCoefficients,
  };
}

if (typeof window !== 'undefined') {
  window.calculateMaterialQuantity = calculateMaterialQuantity;
}
