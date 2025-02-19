const { Item } = require("../../../schemas/inventory");

/**
 * Updates an Item document.
 * @param {object} input
 * @param {Item} item
 * @returns {Promise<Item|undefined>}
 */
module.exports = async (input, item) => {
  try {
    const { mode, gtin, sn, source, cost } = input;
    const now = new Date();
    if (item == null) {
      item = await Item.findOne({ gtin, sn });
    }
    let arg;
    switch (mode) {
      case "RECEIVE":
        arg = { $set: { dateReceived: now, source, cost } };
        break;
      case "FILL":
        if (item.dateFilled) {
          return item;
        }
        arg = { $set: { dateFilled: now } };
        break;
      case "REVERSE":
        arg = { $set: { dateReversed: now }, $unset: { dateFilled: 1 } };
        break;
      case "RETURN":
        arg = { $set: { dateReturned: now } };
        break;
      // case "DELETE":
      //   return await Item.deleteOne({
      //     gtin,
      //     sn,
      //   });
      default:
        arg = {};
    }
    return await Item.findOneAndUpdate({ gtin, sn }, arg, { new: true });
  } catch (e) {
    console.log(e);
  }
};
