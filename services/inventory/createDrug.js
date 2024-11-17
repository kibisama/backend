const Drug = require("../../schemas/inventory/drug");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");

/**
 * Creates a Drug document based on NDC Directory.
 * @param {NdcDir} ndcDir
 * @param {string} alternative_id optional
 * @param {[string]} _rxcui optional
 * @returns {Promise<Drug|undefined>}
 */
module.exports = async (ndcDir, alternative_id, _rxcui) => {
  try {
    const { generic_name, dea_schedule, product_ndc } = ndcDir;
    let rxcui = ndcDir.openfda.rxcui ?? _rxcui;
    /* If NDC Directory misses RxCui nor passed as an argument, it will refer Product Labeling with the same original packager ndc */
    if (!rxcui) {
      if (!product_ndc) {
        return;
      }
      const reference = await ProductLabeling.findOne({
        "openfda.original_packager_product_ndc": product_ndc,
      });
      if (!reference || !reference.openfda?.rxcui) {
        return;
      }
      rxcui = reference.openfda.rxcui;
    }
    /* If Drug already exists and its RxCui array is inclusive  */
    const _result = await Drug.findOne({ rxcui: { $all: rxcui } });
    if (_result) {
      if (alternative_id) {
        return await Drug.findOneAndUpdate(
          {
            _id: _result._id,
          },
          { $addToSet: { children: alternative_id } },
          { new: true }
        );
      }
      return _result;
    }
    /* If Drug already exists but its RxCui array is not inclusive  */
    const result = await Drug.findOne({ rxcui: { $in: rxcui } });
    if (result) {
      const existingRxcui = result.rxcui;
      let match = true;
      const hashTable = {};
      rxcui.forEach((v) => (hashTable[`${v}`] = true));
      for (let i = 0; i < existingRxcui.length; i++) {
        if (!hashTable[`${existingRxcui[i]}`]) {
          match = false;
          break;
        }
      }
      if (match) {
        const query = alternative_id
          ? { $set: { rxcui }, $addToSet: { children: alternative_id } }
          : { $set: { rxcui } };
        return await Drug.findOneAndUpdate({ _id: result._id }, query, {
          new: true,
        });
      }
    }
    /* else */
    return await Drug.create({
      rxcui,
      name: generic_name ?? "MISSING GENERIC NAME",
      dea_schedule,
      children: alternative_id ? [alternative_id] : [],
    });
  } catch (e) {
    console.log(e);
  }
};
