const dayjs = require("dayjs");
const { usdToNumber } = require("../convert");

/**
 * Analyzes Pharmsaver search results.
 * @param {Array} _results
 * @param {string} ndc11
 * @returns {object}
 */

module.exports = (_results, ndc11) => {
  const shortDate = dayjs().add(11, "month"); // settings
  let cheapestSameNdcResult;
  let cheapestShortSameNdcResult;
  const descriptionTable = {};
  for (let i = 0; i < _results.length; i++) {
    const result = _results[i];
    const description = result.description;
    const table = descriptionTable[description];
    if (!table) {
      descriptionTable[description] = result;
    } else {
      if (usdToNumber(table.unitPrice) > usdToNumber(result.unitPrice)) {
        descriptionTable[description] = result;
      }
    }
    if (result.ndc === ndc11) {
      const expDate = dayjs(result.lotExpDate, "MM/YY");
      const longDated = expDate.isAfter(shortDate);
      if (longDated) {
        if (!cheapestSameNdcResult) {
          cheapestSameNdcResult = result;
        } else if (
          usdToNumber(cheapestSameNdcResult.unitPrice) >
          usdToNumber(result.unitPrice)
        ) {
          cheapestSameNdcResult = result;
        }
      } else {
        if (!cheapestShortSameNdcResult) {
          cheapestShortSameNdcResult = result;
        } else if (
          usdToNumber(cheapestShortSameNdcResult.unitPrice) >
          usdToNumber(result.unitPrice)
        ) {
          cheapestShortSameNdcResult = result;
        }
      }
    }
  }
  const item = cheapestSameNdcResult ?? cheapestShortSameNdcResult;
  const results = [];
  for (const prop in descriptionTable) {
    results.push(descriptionTable[prop]);
  }
  results.sort((a, b) => usdToNumber(a.unitPrice) - usdToNumber(b.unitPrice));
  return { item, results };
};
