const dayjs = require("dayjs");
const CardinalProduct = require("../../schemas/cardinal/cardinalProduct");

/**
 * Creates an empty Cardinal Product document with ndc data if no document exists.
 * @param {string} ndc11 must be 11-digit numbers with hyphens
 * @returns {Promise<CardinalProduct|undefined>}
 */
module.exports = async (ndc11) => {
  try {
    const _result = await CardinalProduct.findOne({ ndc: ndc11 });
    if (_result) {
      return;
    } else {
      return await CardinalProduct.create({
        lastUpdated: dayjs(),
        ndc: ndc11,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
