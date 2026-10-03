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

  if (!Number.isInteger(quantity) || quantity <= 0 || param1 <= 0 || param2 <= 0) {
    return -1;
  }

  const productCoefficient = productTypeCoefficients.get(productTypeId);
  const defectRate = materialTypeDefectRates.get(materialTypeId);

  if (productCoefficient === undefined || defectRate === undefined) {
    return -1;
  }

  const baseMaterialQuantity = param1 * param2 * productCoefficient;
  const netMaterialQuantity = baseMaterialQuantity * quantity;
  const materialWithDefect = netMaterialQuantity * (1 + defectRate / 100);

  return Math.ceil(materialWithDefect);
}

module.exports = {
  calculateMaterialQuantity,
  materialTypeDefectRates,
  productTypeCoefficients,
};
