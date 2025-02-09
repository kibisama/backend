const dayjs = require("dayjs");
const {
  Package,
  Alternative,
  DailyOrder,
} = require("../../../schemas/inventory");
const updateSearch = require("../../pharmsaver/updateSearch");
// const { usdToNumber } = require("../../convert");

/**
 * Updates a Daily Order document.
 * @param {Package} package
 * @returns {Promise<undefined>}
 */
module.exports = async function updateDailyOrder(package) {
  try {
    const now = dayjs();
    const todayStart = now.startOf("date");
    const { _id, alternative, cardinalProduct, psItem } = package;
    let _alternative, _cardinalProduct, _psItem, _psSearch;
    const dailyOrder = await DailyOrder.findOne({
      package: _id,
      date: { $gte: todayStart },
    });
    if (alternative) {
      _alternative = await Alternative.findOne({
        _id: alternative,
      }).populate([
        {
          path: "sourcePackage",
          select: [],
          populate: [{ path: "psItem" }, { path: "cardinalProduct" }],
        },
        { path: "psSearch" },
      ]);
      const sourcePackage = _alternative.sourcePackage;
      if (sourcePackage) {
        _psItem = sourcePackage.psItem;
        if (!_psItem || now.isAfter(dayjs(_psItem.lastUpdated), "day")) {
          updateSearch(
            await Package.findOne({ _id: sourcePackage._id }),
            () => {
              updateDailyOrder(package);
            }
          );
          return;
        }
        _cardinalProduct = sourcePackage.cardinalProduct;
      } else {
        //
      }
      _psSearch = _alternative.psSearch;
    } else {
      //
    }
    switch (dailyOrder.status) {
      case "FILLED":
        if (
          _psItem &&
          dayjs(_psItem.lastUpdated).isSame(now, "day") &&
          _cardinalProduct &&
          dayjs(_cardinalProduct.lastUpdated).isSame(now, "day")
        ) {
          await DailyOrder.findOneAndUpdate(
            { _id: dailyOrder._id },
            { status: "UPDATED" }
          );
        } else {
          return;
        }
      // no break
      case "UPDATED":
        const query = {};
        const cahIsAvailable =
          _cardinalProduct.active ||
          !_cardinalProduct.stockStatus !== "OUT OF STOCK";
        const psIsAvailable = _psSearch.active;
        if (!cahIsAvailable) {
          if (psIsAvailable) {
            query.status = "CAH_NA";
          } else {
            query.status = "NA";
          }
        } else if (!psIsAvailable) {
          query.status = "PS_NA";
        }
        if (query.status) {
          await DailyOrder.findOneAndUpdate({ _id: dailyOrder._id }, query);
          return;
        }

      // const cahAnalysis = _cardinalProduct.analysis;
      // const cahIsContract = !!_cardinalProduct.contract;
      // resume after invoice features (need real last price)

      default:
    }
  } catch (e) {
    console.log(e);
  }
};
