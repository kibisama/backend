const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 */

/**
 * @returns {dayjs.Dayjs}
 */
const getToday = () => {
  return dayjs().startOf("date");
};
/**
 * @param {[item.Item]} items
 * @param {package.Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const createDO = async (package) => {
  try {
    const now = new Date();
    return await dailyOrder.create({
      lastUpdated: now,
      date: now,
      package: package._id,
    });
  } catch (e) {
    console.log(e);
  }
};
const upsertDO = async (package) => {
  try {
    const dO = await dailyOrder.findOne({
      package: package._id,
      date: { $gte: getToday() },
    });
  } catch (e) {
    console.log(e);
  }
};
const findFilledItems = async (gtin) => {
  try {
    return await item.find({
      gtin,
      dateFilled: { $gte: getToday() },
    });
  } catch (e) {
    console.log(e);
  }
};
