/**
 * Возвращает процент скидки партнёра по суммарному объёму покупок.
 *
 * @param {number} totalQuantity Суммарный объём купленной продукции.
 * @returns {number} Процент скидки.
 */
function calculatePartnerDiscount(totalQuantity) {
  if (totalQuantity < 10_000) {
    return 0;
  }

  if (totalQuantity < 50_000) {
    return 5;
  }

  if (totalQuantity < 300_000) {
    return 10;
  }

  return 15;
}

module.exports = { calculatePartnerDiscount };
