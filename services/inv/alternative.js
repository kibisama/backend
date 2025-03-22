const alternative = require("../../schemas/alternative");
const package = require("./package");
const getAllHistoricalNDCs = require("../rxnav/getAllHistoricalNDCs");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");

/**
 * @typedef {alternative.Alternative} Alternative
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
    if (!alt) {
      return await findRemappedAlt(rxcui);
    } else if (alt) {
      return alt;
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const findRemappedAlt = async (rxcui) => {
  try {
    const historicalNdcConcept = await getAllHistoricalNDCs(rxcui);
    if (historicalNdcConcept) {
      const remappedRxcui = [];
      historicalNdcConcept.historicalNdcTime.forEach((v) => {
        if (v.status === "indirect") {
          remappedRxcui.push(v.rxcui);
        }
      });
      if (remappedRxcui.length > 0) {
        const alt = await alternative.findOne({
          rxcui: { $in: remappedRxcui },
        });
        if (alt) {
          // in this case, the alt doc needs an update
          return alt;
        }
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
    /** @type {typeof alternative.schema.obj} */
    const filter = { rxcui };
    const output = await getAllRelatedInfo(rxcui);
    return await alternative.create(filter);
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const upsertAlternative = async (rxcui) => {
  try {
    const alt = await findAlternative(rxcui);
    if (!alt) {
      return await createAlternative(rxcui);
    }
    return alt;
  } catch (e) {
    console.log(e);
  }
};
/**
 * Gets defaultName.
 * @param {}
 * @returns {string}
 */
const getDefaultName = () => {
  let name = "";
  //
};

module.exports = { upsertAlternative };
