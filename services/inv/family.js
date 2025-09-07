const family = require("../../schemas/inv/family");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");

/**
 * @typedef {family.Family} Family
 * @typedef {Parameters<family["findOneAndUpdate"]>["1"]} Update
 */

/**
 * Upserts a Family document.
 * @param {string} scdf
 * @returns {Promise<Family|undefined>}
 */
exports.upsertFamily = async (scdf) => {
  try {
    const fm = await family.findOneAndUpdate(
      { scdf },
      {},
      { new: true, upsert: true }
    );
    exports.updateFamily(fm);
    return fm;
  } catch (e) {
    console.error(e);
  }
};

/**
 * Refreshes a Family documnet.
 * @param {Family|ObjectId} fm
 * @returns {Promise<Family|undefined>}
 */
exports.refreshFamily = async (fm) => {
  try {
    return await family.findById(fm);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {function} [callback]
 */

/**
 * Updates a Family document.
 * @param {Family} fm
 * @param {UpdateOption} [option]
 * @returns {Promise<Awaited<ReturnType<Family["updateOne"]>|undefined>}
 */
exports.updateFamily = async (fm, option = {}) => {
  try {
    const { force, callback } = option;
    const { defaultName, scdf } = fm;
    if (force || !defaultName) {
      /** @type {Parameters<family["findOneAndUpdate"]>["1"]} */
      const update = { $set: {} };
      const allRelatedInfo = await getAllRelatedInfo(scdf);
      if (allRelatedInfo) {
        const { sbd, scd, scdf } = allRelatedInfo;
        const rxcui = [];
        if (scdf) {
          update.$set.defaultName = selectName(scdf[0]);
        }
        if (sbd) {
          sbd.forEach((v) => rxcui.push(v.rxcui));
        }
        if (scd) {
          scd.forEach((v) => rxcui.push(v.rxcui));
        }
        if (rxcui.length > 0) {
          update.$addToSet = { rxcui };
        }
      }
      await fm.updateOne(update);
      if (callback instanceof Function) {
        return callback(await exports.refreshFamily(fm));
      }
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {getAllRelatedInfo.ConceptProperties} conceptProperties
 * @returns {string|undefined}
 */
const selectName = (conceptProperties) => {
  const { name, synonym, psn } = conceptProperties;
  if (psn) {
    return psn;
  }
  if (synonym) {
    return synonym;
  }
  return name;
};
