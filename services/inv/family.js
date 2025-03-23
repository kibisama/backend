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
    if (!alt) {
      return await findRemappedAlt(rxcui);
    } else if (alt) {
      return alt;
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = {};
