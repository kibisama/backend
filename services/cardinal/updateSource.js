const { Package } = require("../../schemas/inventory");
const { CardinalProduct } = require("../../schemas/cardinal");
const createPackage = require("../inventory/package/createPackage");
const updatePackage = require("../inventory/package/updatePackage");
const getNDCs = require("../rxnav/getNDCs");
const update = require("./update");
const updateProduct = require("./updateProduct");
const selectSource = require("./selectSource");

/**
 * Request the Puppeteer server to update cardinalSource.
 * @param {Alternative} alternative
 * @param {function} _callback
 * @returns {Promise<undefined>}
 */
module.exports = async function (alternative, _callback) {
  try {
    const { rxcui, cardinalSource } = alternative;
    const ndcs = [];
    if (cardinalSource) {
      const product = await CardinalProduct.findOne({ _id: cardinalSource });
      const ndc = product?.ndc;
      if (ndc) {
        ndcs[0] = ndc;
      }
    } else {
      for (let i = 0; i < rxcui.length; i++) {
        const ndc = await getNDCs(rxcui[i]);
        if (!(ndc instanceof Error)) {
          ndcs.push.apply(ndcs, ndc);
        }
      }
    }
    if (ndcs.length === 0) {
      for (let i = 0; i < rxcui.length; i++) {
        (await Package.find({ rxcui: rxcui[i] })).forEach((v) => {
          ndcs.push(v.ndc11);
        });
      }
      if (ndcs.length === 0) {
        return;
      }
    }
    const callback = async (data) => {
      const source = selectSource(data.results);
      const { cin, ndc } = source;
      let package = await Package.findOne({ ndc11: ndc });
      if (!package) {
        const _package = await createPackage(ndc, "ndc11");
        package = await updatePackage(_package);
      }
      updateProduct(package, { body: { cin } }, _callback);
    };
    const onError = {
      404: async function () {
        //
      },
    };
    update("searchProducts", { queries: ndcs }, callback, onError);
  } catch (e) {
    console.log(e);
  }
};
