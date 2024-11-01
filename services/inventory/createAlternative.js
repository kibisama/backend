const Package = require("../../schemas/inventory/package");
const Alternative = require("../../schemas/inventory/alternative");
const NdcDir = require("../../schemas/openFDA/ndcDir");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");
const createDrug = require("./createDrug");

/*
Creates a Alternative document and a Drug document based on NDC Directory.
If a NdcDir document is not passed, it will search local db for a reference product. 
Returns: Alternative | undefined
*/
module.exports = async (ndcDir, package_id) => {
  try {
    if (!ndcDir) {
      const package = await Package.findOne({ _id: package_id });
      const ndc = package.ndc;
      const productNdc = ndc.substring(0, ndc.indexOf("-", 6));
      const reference = await ProductLabeling.findOne({
        "openfda.original_packager_product_ndc": productNdc,
      });
      if (!reference) {
        return;
      }
      ndcDir = await NdcDir.findOne({
        product_ndc: reference.openfda.product_ndc[0],
      });
    }
    if (!ndcDir) {
      return;
    }
    const { active_ingredients, generic_name, product_ndc } = ndcDir;
    let { rxcui } = ndcDir.openfda;
    if (!rxcui) {
      const reference =
        (await ProductLabeling.findOne({
          "openfda.original_packager_product_ndc": product_ndc,
        })) ??
        (await ProductLabeling.findOne({
          "openfda.product_ndc": product_ndc,
        }));
      if (!reference || !reference.openfda.rxcui) {
        return;
      }
      rxcui = reference.openfda.rxcui;
    }
    const strength = [];
    let name = generic_name;
    if (active_ingredients instanceof Array) {
      active_ingredients.forEach((v) => {
        strength.push(v.strength);
      });
      if (strength.length > 0) {
        name += " ";
      }
      strength.forEach((v, i, a) => {
        let text = v;
        const match = v.match(/(\D+)/);
        if (match && match[0] === a[i + 1]?.match(/(\D+)/)[0]) {
          text = v.substring(0, v.length - match[0].length - 1);
        }
        if (text.startsWith(".")) {
          text = "0" + v;
        }
        if (i === strength.length - 1 && v.endsWith("/1")) {
          name += text.substring(0, text.length - 2);
        } else if (i < a.length - 1) {
          name += text + "-";
        } else {
          name += text;
        }
      });
    }

    const results = await Alternative.find({
      rxcui: { $in: rxcui },
      strength,
    });
    let result;
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].rxcui.length === rxcui.length) {
          if (results[i].rxcui.every((v) => rxcui.includes(v))) {
            result = results[i];
            break;
          }
          continue;
        } else if (results[i].rxcui.length < rxcui.length) {
          if (results[i].rxcui.every((v) => rxcui.includes(v))) {
            result = await Alternative.findOneAndUpdate(
              { _id: results[i]._id },
              { $set: { rxcui } },
              { new: true }
            );
            break;
          }
          continue;
        } else {
          if (rxcui.every((v) => results[i].rxcui.includes(v))) {
            result = results[i];
            break;
          }
        }
      }
    }
    if (!result) {
      result = await Alternative.create({
        rxcui,
        name,
        strength,
        alternatives: package_id ? [package_id] : [],
      });
    } else if (package_id) {
      result = await Alternative.findOneAndUpdate(
        {
          _id: result._id,
        },
        { $addToSet: { alternatives: package_id } },
        { new: true }
      );
    }
    if (package_id) {
      await Package.findOneAndUpdate(
        {
          _id: package_id,
        },
        { alternative: result._id },
        { new: true }
      );
    }
    await createDrug(ndcDir, result._id);
    return result;
  } catch (e) {
    console.log(e);
  }
};
