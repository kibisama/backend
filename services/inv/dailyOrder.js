const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const getSearchResults = require("../ps/getSearchResults");
const getProductDetails = require("../cah/getProductDetails");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 * @typedef {import("./package").Package} Package
 * @typedef {Parameters<dailyOrder["findOneAndUpdate"]>["1"]} UpdateParam
 * @typedef {Parameters<dailyOrder["findOne"]>["0"]} Filter
 */

/**
 * @returns {UpdateParam}
 */
const createUpdateParam = () => {
  return { $set: { lastUpdated: new Date() } };
};
/**
 * @param {Package} package
 * @returns {Filter}
 */
const createFilter = (package) => {
  return { package: package._id };
};
/**
 * @returns {dayjs.Dayjs}
 */
const getTodayStart = () => {
  return dayjs().startOf("date");
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const createDO = async (package) => {
  try {
    const base = createFilter(package);
    const now = new Date();
    base.lastUpdated = now;
    base.date = now;
    return await dailyOrder.create(base);
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
      date: { $gte: getTodayStart() },
    });
    if (!_dailyOrder) {
      _dailyOrder = await createDO(package);
      updateSources(package);
    }
    await updateFilledItems(_dailyOrder, package.gtin);
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
      dateFilled: { $gte: getTodayStart() },
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
      const updateParam = createUpdateParam();
      updateParam.$addToSet = { items: items.map((v) => v._id) };
      return await dailyOrder.findOneAndUpdate({ _id: dO._id }, updateParam, {
        new: true,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @param {} [psOption]
 * @param {} [cahOption]
 * @returns {Promise<undefined>}
 */
const updateSources = (package) => {
  try {
    getSearchResults(package);
    getProductDetails(package, { updateSource: true });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 */
const updateDO = async (package) => {
  const dO = await dailyOrder
    .findOne(createFilter(package))
    .populate([{ path: "" }]);
};

module.exports = {
  upsertDO,
};
