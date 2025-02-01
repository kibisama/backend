const dayjs = require("dayjs");
const { DailyOrder, Item } = require("../../../schemas/inventory");
// const { CardinalProduct } = require("../../../schemas/cardinal");
const { PSItem } = require("../../../schemas/pharmsaver");
// const updateProduct = require("../../cardinal/updateProduct");
const updateSearch = require("../../pharmsaver/updateSearch");

/**
 * Initiate Daily Order for the filled item.
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (package) => {
  try {
    const now = dayjs();
    const todayStart = now.startOf("date");
    const { _id, gtin, ndc11, cardinalProduct, psItem } = package;
    const items = (
      await Item.find({ gtin, dateFilled: { $gte: todayStart } })
    ).map((v) => v._id);
    const dailyOrder = await DailyOrder.findOne({
      package: _id,
      date: { $gte: todayStart },
    });
    if (dailyOrder) {
      return await DailyOrder.findOneAndUpdate(
        { _id: dailyOrder._id },
        { $addToSet: { items } }
      );
    }

    // const dailyOrder = await DailyOrder.findOneAndUpdate(
    //   { package: _id, date: { $gte: todayStart } },
    //   { date: now, lastUpdated: now, $addToSet: { items: item._id } }
    // );

    // let _cardinalProduct;
    // if (cardinalProduct.length > 0) {
    //   for (let i = 0; i < cardinalProduct.length; i++) {
    //     const product = await CardinalProduct.findOne({
    //       _id: cardinalProduct[i],
    //     });
    //     if (product.active) {
    //       _cardinalProduct = product;
    //       break;
    //     }
    //   }
    // }

    if (ndc11) {
      let _psItem;
      if (psItem) {
        _psItem = await PSItem.findOne({ _id: psItem });
      }
      if (!_psItem || todayStart.isAfter(dayjs(_psItem.lastUpdated), "day")) {
        updateSearch(package);
      }
    }

    // if (
    //   !_cardinalProduct ||
    //   todayStart.isAfter(dayjs(_cardinalProduct.lastUpdated), "day")
    // ) {
    //   updateProduct({ query: ndc11 });
    // }

    // return await DailyOrder.create({
    //   lastUpdated: now,
    //   date: now,
    //   status: "FILLED",
    //   items: [item._id],
    //   package: _id,
    // });
  } catch (e) {
    console.log(e);
  }
};
