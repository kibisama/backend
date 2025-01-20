const CardinalProduct = require("../../schemas/cardinal/product");

/**
 * Creates an empty Cardinal Product document with ndc11. Inactivates documents if already exist.
 * @param {string} ndc11 must be 11-digit numbers with hyphens
 * @returns {Promise<CardinalProduct|undefined>}
 */
module.exports = async (ndc11) => {
  try {
    const results = await CardinalProduct.find({ ndc: ndc11 });
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        await CardinalProduct.findOneAndUpdate(
          { _id: results[i]._id },
          { $set: { lastUpdated: new Date(), active: false } }
        );
      }
    } else {
      return await CardinalProduct.create({
        lastUpdated: new Date(),
        ndc: ndc11,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
