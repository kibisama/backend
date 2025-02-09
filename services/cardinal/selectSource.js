const { usdToNumber } = require("../convert");

/**
 * Selects a source product.
 * @param {Array} alts
 * @param {string} orangeBookCode
 * @returns {object|undefined}
 */

module.exports = (alts, orangeBookCode) => {
  if (alts.length > 0) {
    var orangeBookCode = orangeBookCode || alts[alts.length - 1].orangeBookCode;
    let cheapestContractInStock;
    let cheapestContract;
    for (let i = 0; i < alts.length; i++) {
      const alt = alts[i];
      if (!alt.contract) {
        continue;
      }
      if (orangeBookCode && alt.orangeBookCode !== orangeBookCode) {
        continue;
      }
      const altUoiCost = usdToNumber(alt.netUoiCost);
      const inStock = alt.stockStatus !== "OUT OF STOCK";
      if (inStock) {
        if (!cheapestContractInStock) {
          cheapestContractInStock = alt;
        } else {
          const prevUoiCost = usdToNumber(cheapestContractInStock.netUoiCost);
          if (prevUoiCost > altUoiCost) {
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
    }
    return cheapestContractInStock ?? cheapestContract;
  }
};
