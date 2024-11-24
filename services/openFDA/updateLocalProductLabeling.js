const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const ProductLabeling = require("../../schemas/openFDA/productLabeling");
const { label } = require("../../api/openFda");

/**
 * Updates a partial Product Labeling document via openFDA API.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<ProductLabeling|Error|undefined>}
 */
module.exports = async (arg, type) => {
  try {
    let query = "";
    let regEx;
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
      query = `"${frag[0]}-${frag[1] + frag[2]}"+"${frag[0] + frag[1]}-${
        frag[2] + frag[3]
      }"+"${frag[0] + frag[1]}-${frag[2]}"`;
      regEx = new RegExp(
        String.raw`${frag[0]}-?${frag[1]}-?${frag[2]}(${frag[3]}|$)`
      );
    }
    const _result = await ProductLabeling.findOne({
      "openfda.original_packager_product_ndc": { $regex: regEx },
    });
    if (_result) {
      return _result;
    }
    const result = await label.searchOneByByOriginalPackager(query);
    if (result instanceof Error) {
      return new Error("Open FDA error");
    }
    const _results = result.data.results;
    const results = _results
      .sort((a, b) => dayjs(b.effective_time) - dayjs(a.effective_time))
      .sort(
        (a, b) =>
          a.openfda?.original_packager_product_ndc?.length ??
          1000 - b.openfda?.original_packager_product_ndc?.length ??
          1000
      )
      .sort(
        (a, b) =>
          a.openfda.rxcui?.length ?? 1000 - b.openfda.rxcui?.length ?? 1000
      );
    for (let i = 0; i < results.length; i++) {
      if (
        (results[i].openfda.rxcui?.length > 0 &&
          results[i].openfda.original_packager_product_ndc?.some((v) =>
            v.match(regEx)
          )) ||
        i === results.length - 1
      ) {
        return await ProductLabeling.findOneAndUpdate(
          { id: results[i].id },
          {
            lastRetrieved: new Date(),
            ...results[i],
          },
          { new: true, upsert: true }
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
};
