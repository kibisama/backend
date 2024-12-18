const dayjs = require("dayjs");
const createDailyOrder = require("./createDailyOrder");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const CardinalProduct = require("../../schemas/cardinal/cardinalProduct");
const PSSearch = require("../../schemas/pharmsaver/psSearch");
const updateProduct = require("../cardinal/updateProduct");
const updateSearch = require("../pharmsaver/updateSearch");
const updateDailyOrder = require("./updateDailyOrder");

/**
 * Initiate Daily Order service for the item.
 * @param {Item} item
 * @param {Package} package
 * @returns {Promise<undefined>}
 */
module.exports = async (item, package) => {
  const now = dayjs();
  const todayStart = dayjs(now).startOf("date");
  const todayEnd = dayjs(now).endOf("date");
  try {
    const { gtin, _id } = item;
    let dailyOrder = await DailyOrder.findOne({
      gtin,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    if (dailyOrder) {
      return await DailyOrder.findOneAndUpdate(
        { _id: dailyOrder._id },
        { $addToSet: { item: _id }, $set: { lastUpdated: now } }
      );
    }
    let ndc11;
    let update = false;
    if (package) {
      dailyOrder = await createDailyOrder(item, package._id);
      ndc11 = package.ndc11;
      const cardinalProduct = await CardinalProduct.findOne({
        ndc: ndc11,
        lastUpdated: { $gte: todayStart, $lte: todayEnd },
      });
      if (!cardinalProduct) {
        updateProduct({ query: ndc11 }, dailyOrder); // don't have to get the promise solved
      }
      const psSearch = await PSSearch.findOne({
        query: ndc11.replaceAll("-", ""),
        lastUpdated: { $gte: todayStart, $lte: todayEnd },
      });
      if (!psSearch) {
        updateSearch(ndc11, dailyOrder);
      }
      if (cardinalProduct || psSearch) {
        update = true;
      }
    } else {
      // updateProdcut with GTIN from Cardinal and await getting ndc11 from cardinal?
    }
    if (update) {
      await updateDailyOrder(dailyOrder, ndc11);
    }
  } catch (e) {
    console.log(e);
  }
};
