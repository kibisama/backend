const NdcDir = require("../../schemas/openFDA/ndcDir");
const { ndc } = require("../../api/openFda");
const updateLocalProductLabeling = require("./updateLocalProductLabeling");

/**
 * Updates a NDC Directory document via openFDA API.
 * If packaging information or RxCUI is missing, it will try to update the corresponding Product Labeling document.
 * @param {Object} input
 * @returns {Promise<NdcDir|Error|undefined>}
 */
module.exports = async (arg, type) => {
  try {
    let query = "";
    if (type) {
      let frag = [];
      switch (true) {
        case type === "gtin":
          frag = [arg.slice(3, 7), arg[7], arg.slice(8, 11), arg[11], arg[12]];
          break;
        case type === "ndc":
          frag = [arg.slice(0, 4), arg[4], arg.slice(5, 8), arg[8], arg[9]];
          break;
        default:
          throw new Error("Invalid argument type");
      }
      query = `"${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}"+"${
        frag[0] + frag[1]
      }-${frag[2] + frag[3]}-${frag[4]}"+"${frag[0] + frag[1]}-${frag[2]}-${
        frag[3] + frag[4]
      }"`;
    }
    const result = await ndc.searchOneByPackageDescription(query);
    if (result instanceof Error) {
      if (result.status === 404) {
        const reference = await updateLocalProductLabeling(arg, type);
        if (reference instanceof Error || !reference) {
          return result;
        }
        const _query = `"${reference.openfda.product_ndc}"`;
        const _result = await ndc.searchOneByProductNdc(_query);
        if (_result instanceof Error) {
          return _result;
        }
        const data = _result.data.results?.[0];
        await NdcDir.findOneAndUpdate(
          { product_ndc: data.product_ndc },
          {
            lastRetrieved: new Date(),
            ...data,
          },
          { new: true, upsert: true }
        );
        return result;
      }
    } else if (result.data?.meta?.results?.total > 1) {
      return new Error("Multiple results found");
    }
    const data = result.data.results?.[0];
    if (!data.openfda?.rxcui || data.openfda.rxcui.length === 0) {
      await updateLocalProductLabeling(arg, type);
    }
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
  }
};
