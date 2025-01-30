const { NDCDir } = require("../../schemas/openfda");
const { ndc } = require("../../api/openfda");
const { gtinToNDC, ndc11ToNDC } = require("../convert");

/**
 * Updates a NDC Directory document.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<NDCDir|Error>}
 */
module.exports = async (arg, type) => {
  try {
    let query = "";
    switch (type) {
      case "gtin":
        query = gtinToNDC(arg)
          .map((v) => `"${v}"`)
          .join("+");
        break;
      case "ndc11":
        query = ndc11ToNDC(arg)
          .map((v) => `"${v}"`)
          .join("+");
        break;
      default:
        throw new Error("Invalid argument type");
    }
    let result = await ndc.searchOneByPackageDescription(query);
    if (result instanceof Error) {
      return result;
    }
    if (result.data.meta.results.total > 1) {
      return new Error("Multiple results found");
    }
    const data = result.data.results[0];
    return await NDCDir.findOneAndUpdate(
      { product_ndc: data.product_ndc },
      {
        $set: {
          lastRetrieved: new Date(),
          ...data,
        },
      },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.log(e);
    return e;
  }
};
