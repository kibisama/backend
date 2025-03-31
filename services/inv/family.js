const family = require("../../schemas/family");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");
const { setOptionParameters } = require("../common");

/**
 * @typedef {family.Family} Family
 * @typedef {typeof family.schema.obj} UpdateObj
 * @typedef {Parameters<family["findOneAndUpdate"]>["1"]} Update
 */
/**
 * Creates a Family document.
 * @param {string} scdf
 * @returns {Promise<Family|undefined>}
 */
const createFamily = async (scdf) => {
  try {
    return await family.create({ scdf });
  } catch (e) {
    console.log(e);
  }
};
/**
 * Searches a Family document.
 * @param {UpdateObj} obj
 * @returns {Promise<[Family]|undefined>}
 */
const searchFamily = async (obj) => {
  try {
    return (await family.find(obj)) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts a Family document.
 * @param {string} scdf
 * @returns {Promise<Family|undefined>}
 */
const upsertFamily = async (scdf) => {
  try {
    let fm = await family.findOne({ scdf });
    if (fm === null) {
      fm = await createFamily(scdf);
    }
    if (fm) {
      updateFamily(fm);
    }
    return fm;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} force
 */

/**
 * Determines if the Family document needs an update.
 * @param {Family} fm
 * @returns {{rxNav: boolean}}
 */
const needsUpdate = (fm) => {
  let rxNav = false;
  if (!fm.defaultName) {
    rxNav = true;
  }
  return { rxNav };
};
/**
 * Updates a Family document.
 * @param {Family} fm
 * @param {UpdateOption} [option]
 * @returns {Promise<Family|undefined>}
 */
const updateFamily = async (fm, option) => {
  try {
    /** @type {UpdateOption} */
    const defaultOption = { force: false };
    const { force } = setOptionParameters(defaultOption, option);
    /** @type {Update} */
    const update = { $set: {} };
    const { rxNav } = force ? { rxNav: true } : needsUpdate(fm);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(fm);
      if (rxNavData) {
        Object.assign(update, rxNavData);
      }
    }
    if (Object.keys(update.$set).length) {
      return await family.findOneAndUpdate({ _id: fm._id }, update, {
        new: true,
      });
    }
    return fm;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Family} fm
 * @returns {Promise<Update|undefined>}
 */
const updateViaRxNav = async (fm) => {
  try {
    /** @type {Update} */
    const obj = { $set: {}, $addToSet: {} };
    const allRelatedInfo = await getAllRelatedInfo(fm.scdf);
    if (allRelatedInfo) {
      const { sbd, scd, scdf } = allRelatedInfo;
      const rxcui = [];
      if (scdf) {
        obj.$set.defaultName = selectName(scdf[0]);
      }
      if (sbd) {
        sbd.forEach((v) => rxcui.push(v.rxcui));
      }
      if (scd) {
        scd.forEach((v) => rxcui.push(v.rxcui));
      }
      if (rxcui.length > 0) {
        obj.$addToSet.rxcui = rxcui;
      }
    }
    return obj;
  } catch (e) {
    console.log(e);
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
module.exports = { upsertFamily, searchFamily };
