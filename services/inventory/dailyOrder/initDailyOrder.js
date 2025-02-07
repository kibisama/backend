const dayjs = require("dayjs");
const { DailyOrder, Item } = require("../../../schemas/inventory");
const { CardinalProduct } = require("../../../schemas/cardinal");
const { PSItem } = require("../../../schemas/pharmsaver");
const { updateProduct } = require("../../cardinal/update");
const updateSearch = require("../../pharmsaver/updateSearch");

/**
 * Initiate Daily Order for the filled item. This will update corresponding Cardinal Product document(s) and PS Search & Item documents.
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
    const _dailyOrder = await DailyOrder.findOneAndUpdate(
      { package: _id, date: { $gte: todayStart } },
      { $set: { lastUpdated: now, date: now }, $addToSet: { items } },
      { new: true }
    );
    if (_dailyOrder) {
      return _dailyOrder;
    }
    const dailyOrder = await DailyOrder.create({
      lastUpdated: now,
      date: now,
      status: "FILLED",
      items,
      package: _id,
    });
    let _cardinalProduct;
    if (cardinalProduct) {
      _cardinalProduct = await CardinalProduct.findOne({
        _id: cardinalProduct,
      });
    }
    let _psItem;
    if (psItem) {
      _psItem = await PSItem.findOne({ _id: psItem });
    }
    if (ndc11) {
      if (
        !_cardinalProduct ||
        todayStart.isAfter(dayjs(_cardinalProduct.lastUpdated), "day")
      ) {
        updateProduct(package);
      }
      if (!_psItem || todayStart.isAfter(dayjs(_psItem.lastUpdated), "day")) {
        updateSearch(package);
      }
    }
    return dailyOrder;
  } catch (e) {
    console.log(e);
  }
};
