const dayjs = require("dayjs");
const psItem = require("../../schemas/psItem");
const getSearchResults = require("./getSearchResults");
const { setOptionParameters } = require("../common");

/**
 * @typedef {psItem.PSItem} PSItem
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<psItem["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<psItem["findOneAndUpdate"]>["1"]} UpdateParam
 */

/**
 * @param {Date} date
 * @returns {boolean}
 */
const isOld = (date) => {
  return dayjs().startOf("day").isAfter(dayjs(date), "day");
};

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
 * @param {Package} package
 * @returns {typeof psItem.schema.obj}
 */
const createBase = (package) => {
  return {
    lastUpdated: new Date(),
    package: package._id,
  };
};
/**
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
const findItem = async (package) => {
  try {
    return (await psItem.findOne(createFilter(package))) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
const createItem = async (package) => {
  try {
    const item = await psItem.create(createBase(package));
    await package.updateOne({ psItem: item._id });
    return item;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
const voidItem = async (package) => {
  try {
    const item = await findItem(package);
    if (!item) {
      return await createItem(package);
    } else if (item.active) {
      const updateParam = createUpdateParam();
      updateParam.$set.active = false;
      return await psItem.findOneAndUpdate(createFilter(package), updateParam, {
        new: true,
      });
    }
    return item;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
const upsertItem = async (package) => {
  try {
    const item = await findItem(package);
    if (!item) {
      return await createItem(package);
    }
    return item;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @returns {Promise<boolean|undefined>}
 */
const needsUpdate = async (package) => {
  try {
    if (package.psItem) {
      const populated = await package.populate([
        { path: "psItem", select: ["lastUpdated"] },
      ]);
      if (isOld(populated.psItem.lastUpdated)) {
        return true;
      }
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} RequestOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * @param {Package} package
 * @param {RequestOption} [option]
 * @returns {Promise<undefined>}
 */
const requestPuppet = async (package, option) => {
  try {
    const defaultOption = { force: false };
    const { force, callback } = setOptionParameters(defaultOption, option);
    if (force || (await needsUpdate(package))) {
      getSearchResults(package, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @param {import("./getSearchResults".Result)} result
 * @returns {Promise<undefined>}
 */
const handleResult = async (package, result) => {
  try {
    const item = await upsertItem(package);
    if (item) {
      const updateParam = createUpdateParam();
      updateParam.$set.active = true;
      Object.assign(updateParam.$set, result);
      await item.updateOne(updateParam);
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = { voidItem, requestPuppet, handleResult };
