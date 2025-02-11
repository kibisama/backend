const { usdToNumber } = require("../convert");

/**
 * Selects a source product.
 * @param {Array} alts
 * @param {string} orangeBookCode
 * @returns {object|undefined}
 */

module.exports = (alts, orangeBookCode) => {
  var orangeBookCode = orangeBookCode || alts[alts.length - 1].orangeBookCode;
  let cheapestContractInStock;
  let cheapestContract;
  let cheapestInStock;
  for (let i = 0; i < alts.length; i++) {
    const alt = alts[i];
    if (orangeBookCode && alt.orangeBookCode !== orangeBookCode) {
      continue;
    }
    const altUoiCost = usdToNumber(alt.netUoiCost);
    const inStock = alt.stockStatus !== "OUT OF STOCK";
    if (alt.contract) {
      if (inStock) {
        if (!cheapestContractInStock) {
          cheapestContractInStock = alt;
        } else {
          if (usdToNumber(cheapestContractInStock.netUoiCost) > altUoiCost) {
            cheapestContractInStock = alt;
          }
        }
      } else if (!cheapestContract) {
        cheapestContract = alt;
      } else {
        if (usdToNumber(cheapestContract.netUoiCost) > altUoiCost) {
          cheapestContract = alt;
        }
      }
    } else if (inStock) {
      if (!cheapestInStock) {
        cheapestInStock = alt;
      } else {
        if (usdToNumber(cheapestInStock.netUoiCost) > altUoiCost) {
          cheapestInStock = alt;
        }
      }
    }
  }
  return cheapestContractInStock ?? cheapestContract ?? cheapestInStock;
};
