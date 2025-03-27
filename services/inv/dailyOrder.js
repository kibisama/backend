const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 * @typedef {Parameters<dailyOrder["updateOne"]>["0"]} UpdateParam
 */

/**
 * @param {UpdateParam}
 * @returns {UpdateParam}
 */
const createUpdateParam = (obj) => {
  const updateParam = { $set: { lastUpdated: new Date() } };
  return obj ? Object.assign(updateParam, obj) : updateParam;
};
/**
 * @returns {dayjs.Dayjs}
 */
const getToday = () => {
  return dayjs().startOf("date");
};
/**
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
/**
 * @param {package.Package} package
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
    if (items?.length > 0) {
      return await dailyOrder.findOneAndUpdate(
        { _id: dO._id },
        createUpdateParam({ $addToSet: { items: items.map((v) => v._id) } }),
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
