const dayjs = require("dayjs");
const selectSource = require("./selectSource");

/**
 * Analyzes alts & purchase history and assigns analysis property to the result object.
 * @param {object} results
 * @returns {object|undefined}
 */

module.exports = (results) => {
  const now = dayjs();
  const {
    purchaseHistory,
    alts,
    orangeBookCode,
    netUoiCost,
    contract,
    stockStatus,
  } = results;
  const range = 7;
  const shipQty = new Array(range).fill(0);
  //   const returnQty = new Array(range).fill(0);
  const maxUnitCost = new Array(range);
  let lastCost;
  let lowestHistCost;
  let lastSFDCdate;
  let lastSFDCcost;
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
        if (
          Number(unitCost.replaceAll(/[^0-9.]+/g, "")) <
          Number(lowestHistCost.replaceAll(/[^0-9.]+/g, ""))
        ) {
          lowestHistCost = unitCost;
        }
      }
      if (!lastSFDCdate && purchaseHistory[i].orderMethod === "SFDC") {
        lastSFDCdate = purchaseHistory[i].invoiceDate;
        lastSFDCcost = unitCost;
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
              if (
                Number(unitCost.replaceAll(/[^0-9.]+/g, "")) >
                Number(maxUnitCost[j].replaceAll(/[^0-9.]+/g, ""))
              ) {
                maxUnitCost[j] = unitCost;
              }
            }
            break;
          }
        }
      }
    }
  }

  const _source = selectSource(alts, orangeBookCode);
  let source;
  if (_source) {
    const boolStockStatus =
      stockStatus !== "OUT OF STOCK" && stockStatus !== "INELIGIBLE";
    const numberUoiCost = Number(netUoiCost.replaceAll(/[^0-9.]+/g, ""));
    if (contract && boolStockStatus) {
      if (
        numberUoiCost > Number(_source.netUoiCost.replaceAll(/[^0-9.]+/g, ""))
      ) {
        source = _source;
      }
    } else {
      source = _source;
    }
  }

  const analysis = {
    lastCost,
    lowestHistCost,
    lastSFDCdate,
    lastSFDCcost,
    shipQty,
    maxUnitCost,
    source,
  };
  results.analysis = analysis;
  return source;
};
