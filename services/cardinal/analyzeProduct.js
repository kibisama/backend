const dayjs = require("dayjs");

/**
 * Analyzes alts & purchase history and assigns analysis property to the result object.
 * @param {object} results
 * @returns {undefined}
 */

module.exports = (results) => {
  const now = dayjs();
  const { purchaseHistory, alts, orangeBookCode } = results;
  const range = 7;
  const shipQty = new Array(range).fill(0);
  //   const returnQty = new Array(range).fill(0);
  const maxUnitCost = new Array(range);
  let lastCost;
  let lowestHistCost;
  let lastSFDCdate;
  let lastSFDCcost;
  let bestAlt;
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
  if (alts.length > 0) {
    let cheapestContract;
    let cheapest;
    for (let i = 0; i < alts.length; i++) {
      const alt = alts[i];
      if (orangeBookCode && alt.orangeBookCode !== orangeBookCode) {
        continue;
      }
      if (alt.stockStatus === "OUT OF STOCK") {
        continue;
      }
      const altUoiCost = Number(alt.netUoiCost.replaceAll(/[^0-9.]+/g, ""));
      if (alt.contract) {
        if (!cheapestContract) {
          cheapestContract = i;
        } else {
          const prevUoiCost = Number(
            alts[cheapestContract].netUoiCost.replaceAll(/[^0-9.]+/g, "")
          );
          if (prevUoiCost > altUoiCost) {
            cheapestContract = i;
          }
        }
      } else {
        if (!cheapest) {
          cheapest = i;
        } else {
          const prevUoiCost = Number(
            alts[cheapest].netUoiCost.replaceAll(/[^0-9.]+/g, "")
          );
          if (prevUoiCost > altUoiCost) {
            cheapest = i;
          }
        }
      }
      bestAlt = cheapestContract ?? cheapest;
    }
  }
  const analysis = {
    lastCost,
    lowestHistCost,
    lastSFDCdate,
    lastSFDCcost,
    shipQty,
    maxUnitCost,
    bestAlt,
  };
  results.analysis = analysis;
};
