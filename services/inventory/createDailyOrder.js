const DailyOrder = require("../../schemas/inventory/dailyOrder");

/**
 * Creates a Daily Order document.
 * @param {Item} item
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (item) => {
  try {
    const status = "FILLED";
    return await DailyOrder.create({
      lastUpdated: new Date(),
      item: item._id,
      status,
    });
  } catch (e) {
    console.log(e);
  }
};
