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
      const alts = cardinalProduct.alts;
      if (alts.length > 0) {
        alts.sort(
          (a, b) =>
            Number(a.netUoiCost.replaceAll(/[^0-9.]+/g, "")) -
            Number(b.netUoiCost.replaceAll(/[^0-9.]+/g, ""))
        );
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
        let cheapestLongSameNdcResult;
        let cheapestShortSameNdcResult;
        const descriptionTable = {}; // table for the cheapest item of each description
        const descriptionSizeTable = {}; // table for the cheapest item of each size of each description
        for (let i = 0; i < results.length; i++) {
          const v = results[i];
          if (v.ndc === _ndc11) {
            const expDate = dayjs(v.lotExpDate, "MM/YY");
            if (expDate.isAfter(shortDate)) {
              cheapestLongSameNdcResult = v;
              break;
            } else if (!cheapestShortSameNdcResult) {
              cheapestShortSameNdcResult = v;
            }
          } else {
            if (!descriptionTable[v.description]) {
              descriptionTable[v.description] = v;
              descriptionSizeTable[v.description] = {};
              descriptionSizeTable[v.description][v.pkg] = v;
            } else {
              if (!descriptionSizeTable[v.description][v.pkg]) {
                descriptionSizeTable[v.description][v.pkg] = v;
              }
            }
          }
        }
        /* if no original ndc found, the lowest unitPrice of each description will be suggested */
        if (!cheapestLongSameNdcResult && !cheapestShortSameNdcResult) {
          query.psDetails = psNA;
          for (const key in descriptionTable) {
            query.psAlts.push(descriptionTable[key]);
          }
        } else {
          /* else one with the lowest unitPrice and the same pkg and/or the overall lowest unitPrice will be suggested */
          query.psDetails =
            cheapestLongSameNdcResult ?? cheapestShortSameNdcResult;
          const cheapestSameDescriptionSamePkg =
            descriptionSizeTable[query.psDetails.description]?.[
              query.psDetails.pkg
            ];
          if (cheapestSameDescriptionSamePkg) {
            query.psAlts.push(cheapestSameDescriptionSamePkg);
          }
          const cheapestSameDescription =
            descriptionTable[query.psDetails.description];
          if (cheapestSameDescription !== cheapestSameDescriptionSamePkg) {
            query.psAlts.push(cheapestSameDescription);
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
