const Package = require("../../schemas/inventory/package");
const CardinalProduct = require("../../schemas/cardinal/product");
const PSSearch = require("../../schemas/pharmsaver/search");
const createVoidProduct = require("../cardinal/createVoidProduct");
const createVoidSearch = require("../pharmsaver/createVoidSearch");

/**
 * Updates relation fields of a Package document.
 * This will creates void documents if related documents are not found.
 * @param {Package} package
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (package) => {
  try {
    const query = {};
    const { ndc11, _id } = package;
    const cardinalProduct = await CardinalProduct.find({ ndc: ndc11 });
    if (cardinalProduct.length === 0) {
      query.cardinalProduct = [(await createVoidProduct(ndc11))._id];
    } else {
      query.cardinalProduct = cardinalProduct.map((v) => v._id);
    }
    const _ndc11 = ndc11.replaceAll("-", "");
    let psSearch = PSSearch.findOne({ query: _ndc11 });
    if (!psSearch) {
      psSearch = await createVoidSearch(_ndc11);
    }
    query.psSearch = psSearch._id;
    return await Package.findOneAndUpdate({ _id }, query, { new: true });
  } catch (e) {
    console.log(e);
  }
};
