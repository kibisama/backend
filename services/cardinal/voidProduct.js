const { CardinalProduct } = require("../../schemas/cardinal");
const { Package } = require("../../schemas/inventory");

/**
 * Voids a related Cardinal Product document.
 * @param {Package} package
 * @returns {Promise<CardinalProduct|undefined>}
 */
module.exports = async (package) => {
  try {
    const { _id, ndc11, cardinalProduct } = package;
    if (cardinalProduct) {
      return await CardinalProduct.findOneAndUpdate(
        { _id: cardinalProduct },
        { $set: { lastUpdated: new Date(), active: false } }
      );
    } else {
      const cardinalProduct = await CardinalProduct.create({
        lastUpdated: new Date(),
        active: false,
        ndc: ndc11,
      });
      await Package.findOneAndUpdate(
        { _id },
        { cardinalProduct: cardinalProduct._id }
      );
      return cardinalProduct;
    }
  } catch (e) {
    console.log(e);
  }
};
