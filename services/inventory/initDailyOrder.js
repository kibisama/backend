const dayjs = require("dayjs");
const createDailyOrder = require("./createDailyOrder");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const CardinalItem = require("../../schemas/cardinal/cardinalItem");
const PSSearch = require("../../schemas/pharmsaver/psSearch");
const updateItem = require("../cardinal/updateItem");
const updateSearch = require("../pharmsaver/updateSearch");
const updateDailyOrder = require("./updateDailyOrder");

// /**
//  * Initiate Daily Order Service for the item.
//  * @param {Item} item
//  * @returns
//  */
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
    dailyOrder = await createDailyOrder(item);
    if (package) {
      const ndc11 = package.ndc11;
      await DailyOrder.findOneAndUpdate(
        { _id: dailyOrder._id },
        { package: package._id }
      );
      // const cardinalItem = await CardinalItem.findOne({
      //   ndc: ndc11,
      //   lastUpdated: { $gte: todayStart, $lte: todayEnd },
      // });
      const psSearch = await PSSearch.findOne({
        query: ndc11.replaceAll("-", ""),
        lastUpdated: { $gte: todayStart, $lte: todayEnd },
      });
      switch (true) {
        // case !cardinalItem && !psSearch:
        //   Promise.all([
        // updateItem(ndc11, dailyOrder),
        //   updateSearch(ndc11, dailyOrder),
        // ]);
        // break;
        // case !cardinalItem:
        // updateItem(ndc11, dailyOrder);
        // await updateDailyOrder(dailyOrder, ndc11);
        // break;
        case !psSearch:
          updateSearch(ndc11, dailyOrder);
          break;
        default:
          await updateDailyOrder(dailyOrder, ndc11);
      }
      // return
    } else {
      // updateItem with GTIN from Cardinal and await getting ndc11 from cardinal
    }
  } catch (e) {
    console.log(e);
  }
};
