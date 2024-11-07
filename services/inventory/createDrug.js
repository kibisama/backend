const Drug = require("../../schemas/inventory/drug");
const Alternative = require("../../schemas/inventory/alternative");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");

/*
Creates a Drug document. 
Returns: Drug | undefined
*/
module.exports = async (ndcDir, alternative_id) => {
  try {
    const { generic_name, dea_schedule, product_ndc } = ndcDir;
    let { rxcui } = ndcDir.openfda;
    if (!rxcui) {
      const reference = await ProductLabeling.findOne({
        "openfda.original_packager_product_ndc": product_ndc,
      });
      if (!reference || !reference.openfda.rxcui) {
        return;
      }
      rxcui = reference.openfda.rxcui;
    }
    const _result = await Drug.findOne({ rxcui: { $all: rxcui } });
    if (_result) {
      if (_result.rxcui.length > rxcui.length) {
        await Alternative.findOneAndUpdate(
          { _id: alternative_id },
          { $set: { rxcui: _result.rxcui } },
          { new: true }
        );
      }
      return await Drug.findOneAndUpdate(
        {
          _id: _result._id,
        },
        { $addToSet: { families: alternative_id } },
        { new: true }
      );
    }

    const results = await Drug.find({ rxcui: { $in: rxcui } });
    let result;
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const existingRxcui = results[i].rxcui;
        let match = true;
        if (existingRxcui.length < rxcui.length) {
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
              ? { $set: { rxcui }, $addToSet: { families: alternative_id } }
              : { $set: { rxcui } };
            result = await Drug.findOneAndUpdate(
              { _id: results[i]._id },
              query,
              {
                new: true,
              }
            );
            return result;
          }
        }
      }
    }
    if (!result) {
      return await Drug.create({
        rxcui,
        generic_name,
        name: generic_name,
        dea_schedule,
        families: alternative_id ? [alternative_id] : [],
      });
    }
  } catch (e) {
    console.log(e);
  }
};
