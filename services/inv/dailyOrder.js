const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 * @typedef {package.Package} Package
 * @typedef {Parameters<dailyOrder["updateOne"]>["0"]} UpdateParam
 */

/**
 * @returns {UpdateParam}
 */
const createUpdateParam = () => {
  return { $set: { lastUpdated: new Date() } };
};
/**
 * @returns {dayjs.Dayjs}
 */
const getToday = () => {
  return dayjs().startOf("date");
};
/**
 * @param {Package} package
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
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const upsertDO = async (package) => {
  try {
    let _dailyOrder = await dailyOrder.findOne({
      package: package._id,
      date: { $gte: getToday() },
    });
    if (!_dailyOrder) {
      _dailyOrder = await createDO(package);
    }
    updateDO(_dailyOrder, package);
    return _dailyOrder;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {string} gtin
 * @returns {Promise<[item.Item]|undefined>}
 */
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
/**
 * @param {DailyOrder} dO
 * @param {string} gtin
 * @returns {Promise<DailyOrder|undefined>}
 */
const updateFilledItems = async (dO, gtin) => {
  try {
    const items = await findFilledItems(gtin);
    const updateParam = createUpdateParam();
    updateParam.$addToSet = { items: items.map((v) => v._id) };
    if (items?.length > 0) {
      return await dailyOrder.findOneAndUpdate({ _id: dO._id }, updateParam, {
        new: true,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {DailyOrder} dO
 * @param {Package} package
 * @returns {}
 */
const updateDO = async (dO, package) => {
  try {
    await updateFilledItems(dO, package.gtin);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  upsertDO,
};
