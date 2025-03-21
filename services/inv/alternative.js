const alternative = require("../../schemas/alternative");
const package = require("./package");

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
      // find remapped
    }
    return alt;
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
    //
    return await alternative.create({ rxcui });
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
    if (alt === null) {
      return await createAlternative(rxcui);
    }
    return alt;
  } catch (e) {
    console.log(e);
  }
};
module.exports = { upsertAlternative };
