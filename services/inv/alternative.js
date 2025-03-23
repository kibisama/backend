const alternative = require("../../schemas/alternative");
const package = require("./package");
const getAllHistoricalNDCs = require("../rxnav/getAllHistoricalNDCs");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");

/**
 * @typedef {alternative.Alternative} Alternative
 * @typedef {typeof package.schema.obj} Update
 * @typedef {package.Package} Package
 */
/**
 * Finds an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const findAlternative = async (rxcui) => {
  try {
    const alt = await alternative.findOne({ rxcui });
    if (alt) {
      return alt;
    } else {
      // rxcui: { $in: remappedRxcui }
      // return await findRemappedAlt(rxcui);
      // in this case the alt doc needs update
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {string} rxcui
 * @returns {Promise<[string]|undefined>}
 */
const findOldRxcui = async (rxcui) => {
  try {
    const historicalNdcConcept = await getAllHistoricalNDCs(rxcui);
    if (historicalNdcConcept) {
      const oldRxcui = [];
      historicalNdcConcept.historicalNdcTime.forEach((v) => {
        if (v.status === "indirect") {
          oldRxcui.push(v.rxcui);
        }
      });
      if (oldRxcui.length > 0) {
        return oldRxcui
      }
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Creates an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const createAlternative = async (rxcui) => {
  try {
    return await alternative.create({ rxcui });
  } catch (e) {
    console.log(e);
  }
};

/**
 * Upserts an Alternative document.
 * @param {string} rxcui
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
const upsertAlternative = async (rxcui, option) => {
  try {
    let alt = await findAlternative(rxcui);
    if (!alt) {
      alt = await createAlternative(rxcui);
    }
    updateAlternative(alt, option);
    return alt;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} force
 * @property {Function} callback
 */

/**
 * Determines if the Alternative document needs an update.
 * @param {Alternative} alt
 * @returns {{rxNav: boolean}}
 */
const needsUpdate = (alt) => {
  let rxNav = false;
  if (!alt.genericName || !alt.brandName) {
    rxNav = true;
  }
  return { rxNav };
};
/**
 * Updates an Alternative document.
 * @param {Alternative} alt
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
const updateAlternative = async (alt, option) => {
  try {
    let rxcui = alt.rxcui[0];
    if (alt.rxcui.length > 1) {
      //
    }
    /** @type {Update} */
    const update = {};
    const { rxNav } = needsUpdate(alt);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(rxcui);
      // if (rxNavData) {
      //   Object.assign(update, rxNavData);
      // }
    }
    // if (Object.keys(update).length) {
    //   _pkg = await package.findOneAndUpdate({ _id: _pkg._id }, update, {
    //     new: true,
    //   });
    // }
    // if (_pkg.rxcui) {
    //   const pkg = await linkWithAlternative(_pkg);
    //   _pkg = pkg ?? _pkg;
    // }
    // return _pkg;
  } catch (e) {
    console.log(e);
  }
};
// /**
//  * @param {Alternative} alt
//  * @returns {Promise<>}
//  */
// const selectRxcui = async (alt) => {
//   try {
//     /** @type {Update} */
//     const obj = {};
//     // const output = await getAllRelatedInfo(rxcui);
//     return obj;
//   } catch (e) {
//     console.log(e);
//   }
// };
/**
 * @param {string} rxcui
 * @returns {Promise<Update|undefined>}
 */
const updateViaRxNav = async (rxcui) => {
  try {
    /** @type {Update} */
    const obj = {};
    const output = await getAllRelatedInfo(rxcui);
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

module.exports = { upsertAlternative };
