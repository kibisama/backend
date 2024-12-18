const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");

/**
 * Creates a Daily Order document.
 * @param {Item} item
 * @param {string} package_id
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (item, package_id) => {
  try {
    const now = dayjs();
    const { gtin, _id } = item;
    const status = "FILLED";
    return await DailyOrder.create({
      lastUpdated: now,
      date: now,
      status,
      gtin,
      item: [_id],
      package: package_id,
    });
  } catch (e) {
    console.log(e);
  }
};
