const dayjs = require("dayjs");
const selectSource = require("./selectSource");
const { usdToNumber } = require("../convert");

/**
 * Analyzes alts & purchase history and assigns analysis property to the result object.
 * @param {object} results
 * @returns {object|undefined}
 */

module.exports = (results) => {
  const now = dayjs();
  const { purchaseHistory, alts } = results;
  const range = 7;
  const shipQty = new Array(range).fill(0);
  //   const returnQty = new Array(range).fill(0);
  const maxUnitCost = new Array(range);
  let lastCost;
  let lowestHistCost;
  let lastSFDCDate;
  let lastSFDCCost;
  if (purchaseHistory.length > 0) {
    const dates = new Array(range);
    for (let i = 0; i < dates.length; i++) {
      dates[i] = now.subtract(range - 1 - i, "M");
    }
    /* Note: Cardinal Purchase History is not up-to-date and requires to refer invoices for the most recent data */
    let innerLoopDone = false;
    for (let i = 0; i < purchaseHistory.length; i++) {
      const invoiceCost = purchaseHistory[i].invoiceCost;
      const unitCost = purchaseHistory[i].unitCost;
      /* ignore returns & omits */
      if (invoiceCost.startsWith("-") || invoiceCost === "$0.00") {
        continue;
      }
      if (!lastCost) {
        lastCost = unitCost;
      }
      if (!lowestHistCost) {
        lowestHistCost = unitCost;
      } else {
        if (usdToNumber(unitCost) < usdToNumber(lowestHistCost)) {
          lowestHistCost = unitCost;
        }
      }
      if (!lastSFDCDate && purchaseHistory[i].orderMethod === "SFDC") {
        lastSFDCDate = purchaseHistory[i].invoiceDate;
        lastSFDCCost = unitCost;
      }
      if (innerLoopDone) {
        continue;
      }
      const invoiceDate = dayjs(purchaseHistory[i].invoiceDate);
      if (invoiceDate.isBefore(dates[0], "month")) {
        innerLoopDone = true;
        continue;
      } else {
        for (let j = 0; j < dates.length; j++) {
          if (invoiceDate.isSame(dates[j], "month")) {
            shipQty[j] += Number(purchaseHistory[i].shipQty);
            if (!maxUnitCost[j]) {
              maxUnitCost[j] = unitCost;
            } else {
              if (usdToNumber(unitCost) > usdToNumber(maxUnitCost[j])) {
                maxUnitCost[j] = unitCost;
              }
            }
            break;
          }
        }
      }
    }
  }
  let source;
  if (alts.length > 0) {
    const keys = Object.keys(alts[0]);
    const item = {};
    keys.forEach((v) => {
      item[v] = results[v];
    });
    alts.push(item);
    const _source = selectSource(alts);
    if (_source.cin !== results.cin) {
      source = _source;
    }
  }

  const analysis = {
    lastCost,
    lowestHistCost,
    lastSFDCDate,
    lastSFDCCost,
    shipQty,
    maxUnitCost,
    source,
  };
  results.analysis = analysis;
  return source;
};
