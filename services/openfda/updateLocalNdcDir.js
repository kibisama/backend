const NdcDir = require("../../schemas/openfda/ndcDir");
const { ndc } = require("../../api/openfda");

/**
 * Updates a NDC Directory document via openFDA api.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<NdcDir|Error>}
 */
module.exports = async (arg, type) => {
  try {
    let query;
    let frag;
    switch (true) {
      case type === "gtin":
        frag = [arg.slice(3, 7), arg[7], arg.slice(8, 11), arg[11], arg[12]];
        query = `"${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}"+"${
          frag[0] + frag[1]
        }-${frag[2] + frag[3]}-${frag[4]}"+"${frag[0] + frag[1]}-${frag[2]}-${
          frag[3] + frag[4]
        }"`;
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
    return await NdcDir.findOneAndUpdate(
      { product_ndc: data.product_ndc },
      {
        lastRetrieved: new Date(),
        ...data,
      },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.log(e);
    return e;
  }
};
