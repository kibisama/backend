const CardinalProduct = require("../../schemas/cardinal/product");
const Package = require("../../schemas/inventory/package");

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
      const product = await CardinalProduct.create({
        lastUpdated: new Date(),
        active: false,
        ndc: ndc11,
      });
      await Package.findOneAndUpdate(
        { ndc11 },
        { $addToSet: { cardinalProduct: product._id } }
      );
      return product;
    }
  } catch (e) {
    console.log(e);
  }
};
