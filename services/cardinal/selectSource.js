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
      const altUoiCost = Number(alt.netUoiCost.replaceAll(/[^0-9.]+/g, ""));
      const inStock = alt.stockStatus !== "OUT OF STOCK";
      if (inStock) {
        if (!cheapestContractInStock) {
          cheapestContractInStock = alt;
        } else {
          const prevUoiCost = Number(
            cheapestContractInStock.netUoiCost.replaceAll(/[^0-9.]+/g, "")
          );
          if (prevUoiCost > altUoiCost) {
            cheapestContractInStock = alt;
          }
        }
      } else if (!cheapestContract) {
        cheapestContract = alt;
      } else {
        const prevUoiCost = Number(
          cheapestContract.netUoiCost.replaceAll(/[^0-9.]+/g, "")
        );
        if (prevUoiCost > altUoiCost) {
          cheapestContract = alt;
        }
      }
    }
    return cheapestContractInStock ?? cheapestContract;
  }
};
