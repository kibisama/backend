const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");
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
  return { package: package._id, date: { $gte: getTodayStart() } };
};
/**
 * @returns {dayjs.Dayjs}
 */
const getTodayStart = () => {
  return dayjs().startOf("date");
};
/**
 * @param {Date}
 * @returns {boolean}
 */
const isNew = (date) => {
  if (!(date instanceof Date)) {
    throw new Error();
  }
  return dayjs(date).isAfter(getTodayStart());
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const createDO = async (package) => {
  try {
    const now = new Date();
    return await dailyOrder.create({
      package: package._id,
      lastUpdated: now,
      date: now,
    });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const findDO = async (package) => {
  try {
    return (await dailyOrder.findOne(createFilter(package))) ?? undefined;
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
    let _dailyOrder = await findDO(package);
    if (!_dailyOrder) {
      _dailyOrder = await createDO(package);
      updateSources(package);
    }
    return await updateFilledItems(_dailyOrder, package.gtin);
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
    return dO;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @param {} [psOption]
 * @param {} [cahOption]
 * @returns {Promise<undefined>}
 */
const updateSources = (pkg) => {
  try {
    const callback = async () => {
      updateDO(await package.updatePackage(pkg));
    };
    getSearchResults(pkg, { callback });
    getProductDetails(pkg, { updateSource: true, callback });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @returns {Promise<|undefined>}
 */
const updateDO = async (package) => {
  try {
    const dO = await dailyOrder.findOne(createFilter(package)).populate({
      path: "package",
      populate: [
        { path: "cahProduct" },
        { path: "psPackage" },
        {
          path: "alternative",
          populate: [
            { path: "cahProduct" },
            { path: "psAlternative" },
            { path: "genAlt", populate: "cahProduct" },
          ],
        },
      ],
    });
    if (!dO) {
      return;
    }
    switch (dO.status) {
      case "FILLED":
        if (isSourceUpdated(dO)) {
          //
        } else {
          return;
        }
      case "UPDATED":
      default:
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {DailyOrder} populatedDO
 * @returns {boolean}
 */
const isSourceUpdated = (populatedDO) => {
  /** @type {Package} */
  const { cahProduct, psPackage, alternative } = populatedDO.package;
  if (
    cahProduct &&
    psPackage &&
    isNew(cahProduct.lastUpdated) &&
    isNew(psPackage.lastUpdated)
  ) {
    if (alternative) {
      const source = alternative.cahProduct;
      if (source && isNew(source.lastUpdated)) {
        if (alternative.isBranded === true) {
          const genSource = alternative.genAlt?.cahProduct;
          if (genSource) {
            if (!isNew(genSource.lastUpdated)) {
              return false;
            }
          }
        }
        return true;
      }
    } else {
      return true;
    }
  }
  return false;
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {}
 */
const generateData = (populatedDO) => {
  //
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {string}
 */
const getName = (populatedDO) => {
  const package = populatedDO.package;
  const alt = package.alternative;
  if (alt && alt.defaultName) {
    if (package.size) {
      return `${alt.defaultName} (${package.szie})`;
    }
    return alt.defaultName;
  }
  const { ndc11, ndc, gtin } = package;
  return ndc11 || ndc || gtin;
};

module.exports = {
  upsertDO,
};
