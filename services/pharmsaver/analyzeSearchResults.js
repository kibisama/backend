const dayjs = require("dayjs");

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
      if (
        Number(table.unitPrice.replaceAll(/[^0-9.]+/g, "")) >
        Number(result.unitPrice.replaceAll(/[^0-9.]+/g, ""))
      ) {
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
          Number(cheapestSameNdcResult.unitPrice.replaceAll(/[^0-9.]+/g, "")) >
          Number(result.unitPrice.replaceAll(/[^0-9.]+/g, ""))
        ) {
          cheapestSameNdcResult = result;
        }
      } else {
        if (!cheapestShortSameNdcResult) {
          cheapestShortSameNdcResult = result;
        } else if (
          Number(
            cheapestShortSameNdcResult.unitPrice.replaceAll(/[^0-9.]+/g, "")
          ) > Number(result.unitPrice.replaceAll(/[^0-9.]+/g, ""))
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
  results.sort(
    (a, b) =>
      Number(a.unitPrice.replaceAll(/[^0-9.]+/g, "")) -
      Number(b.unitPrice.replaceAll(/[^0-9.]+/g, ""))
  );
  return { item, results };
};
