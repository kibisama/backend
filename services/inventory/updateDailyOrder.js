const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const CardinalItem = require("../../schemas/cardinal/cardinalItem");
const PSSearch = require("../../schemas/pharmsaver/psSearch");

module.exports = async (dailyOrder, ndc11) => {
  console.log("UPDATING DAILY ORDER");
  const query = {};
  if (!ndc11) {
    const { package } = await DailyOrder.findById(dailyOrder._id).populate([
      { path: "package", select: ["ndc11"] },
    ]);
    ndc11 = package.ndc11;
  }
  const cardinalItem = await CardinalItem.findOne({ ndc: ndc11 });
  const psSearch = await PSSearch.findOne({ ndc: ndc11.replaceAll("-", "") });
  if (cardinalItem) {
    query.cardinalCost = cardinalItem.estNetCost;
  }
  if (psSearch) {
    const {
      lastUpdated,
      description,
      str,
      pkg,
      form,
      pkgPrice,
      ndc,
      qtyAvl,
      unitPrice,
      rxOtc,
      lotExpDate,
      bG,
      wholesaler,
      manufacturer,
    } = psSearch;
    if (description.length === 0) {
      query.secondaryDetails = {
        description: "NOT AVAILABLE",
        str: "NOT AVAILABLE",
        pkgPrice: "NOT AVAILABLE",
        qtyAvl: "NOT AVAILABLE",
        unitPrice: "NOT AVAILABLE",
        wholesaler: "NOT AVAILABLE",
        lotExpDate: "NOT AVAILABLE",
      };
    } else {
      const sameNdcIndex = [];
      ndc.forEach((v, i) => {
        if (v === ndc11.replaceAll("-", "")) {
          sameNdcIndex.push(i);
        }
      });
      const _sameNdcCosts = [];
      sameNdcIndex.forEach((v) => {
        _sameNdcCosts.push(pkgPrice[v]);
      });
      const sameNdcCosts = _sameNdcCosts.map((v) =>
        Number(v.replace(/[^0-9.]+/g, ""))
      );
      const lowestCostIndex =
        sameNdcIndex[sameNdcCosts.indexOf(Math.min(...sameNdcCosts))];
      query.secondaryDetails = {
        description: description[lowestCostIndex],
        str: str[lowestCostIndex],
        pkgPrice: pkgPrice[lowestCostIndex],
        qtyAvl: qtyAvl[lowestCostIndex],
        unitPrice: unitPrice[lowestCostIndex],
        wholesaler: wholesaler[lowestCostIndex],
        lotExpDate: lotExpDate[lowestCostIndex],
      };
    }
    if (cardinalItem && psSearch) {
      query.orderStatus = "UPDATED";
    }
    // 검색결과없으면 schedule
    query.lastUpdated = dayjs();
    return await DailyOrder.findOneAndUpdate(
      {
        _id: dailyOrder._id,
      },
      { ...query }
    );
  }

  try {
  } catch (e) {
    console.log(e);
  }
};
