const dayjs = require("dayjs");
const psPackage = require("../../schemas/psPackage");
const { refreshPackage } = require("../inv/package");

/**
 * @typedef {psPackage.PSPackage} PSPackage
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<psPackage["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<psPackage["findOneAndUpdate"]>["1"]} UpdateParam
 */

/**
 * @param {Date} date
 * @returns {boolean}
 */
const isOld = (date) => {
  return dayjs(date).isBefore(dayjs().startOf("day"));
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
 * @returns {typeof psPackage.schema.obj}
 */
const createBase = (package) => {
  return {
    lastUpdated: new Date(),
    package: package._id,
  };
};
/**
 * @param {Package} package
 * @returns {Promise<PSPackage|undefined>}
 */
const findItem = async (package) => {
  try {
    return (await psPackage.findOne(createFilter(package))) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSPackage|undefined>}
 */
const createItem = async (package) => {
  try {
    const item = await psPackage.create(createBase(package));
    await package.updateOne({ psPackage: item._id });
    return item;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSPackage|undefined>}
 */
const voidItem = async (package) => {
  try {
    const item = await findItem(package);
    if (!item) {
      return await createItem(package);
    }
    const updateParam = createUpdateParam();
    updateParam.$set.active = false;
    return await psPackage.findOneAndUpdate(
      createFilter(package),
      updateParam,
      { new: true }
    );
    return item;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<PSPackage|undefined>}
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
 * @param {Package} pkg
 * @returns {Promise<boolean|undefined>}
 */
const needsUpdate = async (pkg) => {
  try {
    const package = await refreshPackage(pkg);
    if (package.psPackage) {
      const populated = await package.populate([
        { path: "psPackage", select: ["lastUpdated"] },
      ]);
      if (isOld(populated.psPackage.lastUpdated)) {
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
 * @param {Package} package
 * @param {import("./getSearchResults").Result} result
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

module.exports = { voidItem, handleResult, needsUpdate };
