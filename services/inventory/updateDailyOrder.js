const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const CardinalProduct = require("../../schemas/cardinal/cardinalProduct");
const PSSearch = require("../../schemas/pharmsaver/psSearch");

const psNA = {
  description: "N/A",
  str: "N/A",
  pkg: "N/A",
  form: "N/A",
  pkgPrice: "N/A",
  ndc: "N/A",
  qtyAvl: "N/A",
  unitPrice: "N/A",
  rxOtc: "N/A",
  lotExpDate: "N/A",
  bG: "N/A",
  wholesaler: "N/A",
  manufacturer: "N/A",
};

module.exports = async (dailyOrder, ndc11) => {
  try {
    const now = dayjs();
    const todayStart = dayjs(now).startOf("date");
    const todayEnd = dayjs(now).endOf("date");
    const query = { lastUpdated: now };
    // add an argument so that this step can be passed when it is called right after scraping
    const cardinalProduct = await CardinalProduct.findOne({
      ndc: ndc11,
      lastUpdated: { $gte: todayStart, $lte: todayEnd },
    });
    const _ndc11 = ndc11.replaceAll("-", "");
    const psSearch = await PSSearch.findOne({
      query: _ndc11,
      lastUpdated: { $gte: todayStart, $lte: todayEnd },
    });
    if (cardinalProduct && !dailyOrder.cardinalProduct) {
      query.cardinalProduct = cardinalProduct._id;
      const purchaseHistory = cardinalProduct.purchaseHistory;
      if (purchaseHistory.length > 0) {
        const range = 7;
        const dates = new Array(range);
        const shipQty = new Array(range);
        shipQty.fill(0);
        const maxUnitCost = new Array(range);
        for (let i = 0; i < dates.length; i++) {
          dates[i] = now.subtract(range - 1 - i, "M");
        }
        let lowestHistCost;
        let lastSFDCdate;
        let lastSFDCcost;
        let innerLoopDone = false;
        for (let i = 0; i < purchaseHistory.length; i++) {
          const invoiceCost = purchaseHistory[i].invoiceCost;
          const unitCost = purchaseHistory[i].unitCost;
          if (invoiceCost.startsWith("-") || invoiceCost === "$0.00") {
            continue;
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
            loop = true;
            continue;
          } else {
            for (let i = 0; i < dates.length; i++) {
              if (invoiceDate.isSame(dates[i], "month")) {
                shipQty[i] += Number(purchaseHistory[i].shipQty);
                if (!maxUnitCost[i]) {
                  maxUnitCost[i] = unitCost;
                } else {
                  if (
                    Number(unitCost.replaceAll(/[^0-9.]+/g, "")) >
                    Number(maxUnitCost[i].replaceAll(/[^0-9.]+/g, ""))
                  ) {
                    maxUnitCost[i] = unitCost;
                  }
                }
              }
            }
          }
        }
        query.cardinalProductAnalysis = {
          lowestHistCost,
          lastSFDCdate,
          lastSFDCcost,
          shipQty,
          maxUnitCost,
        };
      }
      const alts = cardinalProduct.alts;
      if (alts.length > 0) {
        alts.sort(
          (a, b) =>
            Number(a.netUoiCost.replaceAll(/[^0-9.]+/g, "")) -
            Number(b.netUoiCost.replaceAll(/[^0-9.]+/g, ""))
        );
        let contractInStock;
        let contract;
        let inStock;
        for (let i = 0; i < alts.length; i++) {
          const alt = alts[i];
          if (
            alt.orangeBookCode === cardinalProduct.orangeBookCode &&
            (alt.stockStatus === "IN STOCK" || Number(alt.stock) > 0)
          ) {
            query.cardinalAlt = alt;
            break;
          }
        }
      } else {
        // ad N/A
      }
    }
    if (psSearch && dailyOrder.psAlts.length === 0) {
      const { lastUpdated, results } = psSearch;
      query.psLastUpdated = lastUpdated;
      query.psAlts = [];
      /* if PS Search is void */
      if (results.length === 0) {
        query.psDetails = psNA;
      } else {
        results.sort(
          (a, b) =>
            Number(a.unitPrice.replaceAll(/[^0-9.]+/g, "")) -
            Number(b.unitPrice.replaceAll(/[^0-9.]+/g, ""))
        );
        const shortDate = now.add(11, "month");
        let cheapestSameNdcResult;
        let cheapestShortSameNdcResult;
        const descriptionTable = {}; // table for the cheapest item of each description
        const descriptionSizeTable = {}; // table for the cheapest item of each size of each description
        for (let i = 0; i < results.length; i++) {
          const v = results[i];
          const expDate = dayjs(v.lotExpDate, "MM/YY");
          const longDated = expDate.isAfter(shortDate);
          if (v.ndc === _ndc11) {
            if (longDated) {
              cheapestSameNdcResult = v;
              break;
            } else if (!cheapestShortSameNdcResult) {
              cheapestShortSameNdcResult = v;
            }
          } else {
            if (!descriptionTable[v.description]) {
              descriptionTable[v.description] = {};
              if (longDated) {
                descriptionTable[v.description].long = v;
              } else {
                descriptionTable[v.description].short = v;
              }
              descriptionSizeTable[v.description] = {};
            } else if (longDated && !descriptionTable[v.description].long) {
              descriptionTable[v.description].long = v;
            }
            if (!descriptionSizeTable[v.description][v.pkg]) {
              descriptionSizeTable[v.description][v.pkg] = v;
            }
          }
        }
        /* if no original ndc found, the lowest unitPrice of each description will be suggested */
        if (!cheapestSameNdcResult && !cheapestShortSameNdcResult) {
          query.psDetails = psNA;
          for (const key in descriptionTable) {
            query.psAlts.push(
              descriptionTable[key].long ?? descriptionTable[key].short
            );
          }
        } else {
          /* else one with the lowest unitPrice and the same pkg and/or the overall lowest unitPrice will be suggested */
          query.psDetails = cheapestSameNdcResult ?? cheapestShortSameNdcResult;
          let cheapestSameDescription;
          const _cheapestSameDescription =
            descriptionTable[query.psDetails.description];
          if (_cheapestSameDescription) {
            const cheapestSameDescriptionSamePkg =
              descriptionSizeTable[query.psDetails.description][
                query.psDetails.pkg
              ];
            const long = _cheapestSameDescription.long;
            const short = _cheapestSameDescription.short;
            if (query.psDetails === cheapestShortSameNdcResult) {
              if (long && short) {
                if (
                  Number(long.unitPrice.replaceAll(/[^0-9.]+/g, "")) >
                  Number(short.unitPrice.replaceAll(/[^0-9.]+/g, ""))
                ) {
                  cheapestSameDescription = short;
                } else {
                  cheapestSameDescription = long;
                }
              }
            }
            if (!cheapestSameDescription) {
              cheapestSameDescription = long ?? short;
            }
            if (cheapestSameDescription) {
              query.psAlts.push(cheapestSameDescription);
            }
            if (
              cheapestSameDescriptionSamePkg &&
              cheapestSameDescription !== cheapestSameDescriptionSamePkg
            ) {
              query.psAlts.push(cheapestSameDescriptionSamePkg);
            }
          }
        }
        if (query.psAlts.length === 0) {
          query.psAlts[0] = psNA;
        }
      }
    }
    if (cardinalProduct && psSearch) {
      query.status = "UPDATED";
    }
    return await DailyOrder.findOneAndUpdate(
      {
        _id: dailyOrder._id,
      },
      query
    );
  } catch (e) {
    console.log(e);
  }
};
