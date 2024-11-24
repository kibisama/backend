const DailyOrder = require("../../schemas/inventory/dailyOrder");

/**
 * Creates a Daily Order document.
 * @param {Item} item
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (item) => {
  try {
    const { gtin, _id } = item;
    const status = "FILLED";
    return await DailyOrder.create({
      status,
      gtin,
      item: [_id],
    });
  } catch (e) {
    console.log(e);
  }
};
