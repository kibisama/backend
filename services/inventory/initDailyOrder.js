// const dayjs = require("dayjs");
// const DailyOrder = require("../../schemas/inventory/dailyOrder");
// const Package = require("../../schemas/inventory/package");
// const CardinalProduct = require("../../schemas/cardinal/product");
// const PSItem = require("../../schemas/pharmsaver/item");
// const updateProduct = require("../cardinal/updateProduct");
// const updateItem = require("../pharmsaver/updateItem");

// /**
//  * Initiate Daily Order for the filled item.
//  * @param {Package} package
//  * @param {Item} item
//  * @returns {Promise<DailyOrder|undefined>}
//  */
// module.exports = async (package, item) => {
//   try {
//     const now = dayjs();
//     const todayStart = now.startOf("date");
//     const { _id, ndc11, cardinalProduct, psItem } = package;
//     const dailyOrder = await DailyOrder.findOneAndUpdate(
//       { package: _id, date: { $gte: todayStart } },
//       { date: now, lastUpdated: now, $addToSet: { items: item._id } }
//     );
//     if (dailyOrder) {
//       return dailyOrder;
//     }
//     let _cardinalProduct;
//     if (cardinalProduct.length > 0) {
//       for (let i = 0; i < cardinalProduct.length; i++) {
//         const product = await CardinalProduct.findOne({
//           _id: cardinalProduct[i],
//         });
//         if (product.active) {
//           _cardinalProduct = product;
//         }
//       }
//     }
//     let _psItem;
//     if (psItem) {
//       _psItem = await PSItem.findOne({ _id: psItem });
//     }
//     if (
//       !_cardinalProduct ||
//       todayStart.isAfter(dayjs(_cardinalProduct.lastUpdated), "day")
//     ) {
//       updateProduct({ query: ndc11 });
//     }
//     if (!_psItem || todayStart.isAfter(dayjs(_psItem.lastUpdated), "day")) {
//       updateItem(ndc11);
//     }
//     return await DailyOrder.create({
//       lastUpdated: now,
//       date: now,
//       status: "FILLED",
//       items: [item._id],
//       package: _id,
//     });
//   } catch (e) {
//     console.log(e);
//   }
// };
