const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const Package = require("../../schemas/inventory/package");
const updateProduct = require("../cardinal/updateProduct");
const updateSearch = require("../pharmsaver/updateSearch");

/**
 * Initiate Daily Order for the filled item.
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (package, item) => {
  try {
    const now = dayjs();
    const todayStart = now.startOf("date");
    const { _id, ndc11, cardinalProduct, psSearch } = package;
    const dailyOrder = await DailyOrder.findOneAndUpdate(
      { package: _id, date: { $gte: todayStart } },
      { date: now, lastUpdated: now, $addToSet: { items: item._id } }
    );
    if (dailyOrder) {
      return dailyOrder;
    }
    let _cardinalProduct;
    for (let i = 0; i < cardinalProduct.length; i++) {
      const active = cardinalProduct[i].active;
      if (active === undefined || active === true) {
        _cardinalProduct = cardinalProduct[i];
      }
    }
    if (
      _cardinalProduct.active === undefined ||
      todayStart.isAfter(dayjs(cardinalProduct.lastUpdated), "day")
    ) {
      updateProduct({ query: ndc11 });
    }
    if (
      psSearch.active === undefined ||
      todayStart.isAfter(dayjs(psSearch.lastUpdated), "Day")
    ) {
      updateSearch(ndc11);
    }
  } catch (e) {
    console.log(e);
  }
};
