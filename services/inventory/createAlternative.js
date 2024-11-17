const Package = require("../../schemas/inventory/package");
const Alternative = require("../../schemas/inventory/alternative");
const NdcDir = require("../../schemas/openFDA/ndcDir");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");
const createDrug = require("./createDrug");

/**
 * Creates an Alternative document based on NDC Directory and/or Package.
 * @param {NdcDir} ndcDir
 * @param {Package} package
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async (ndcDir, package) => {
  try {
    /* If NDC Directory of the original item is missing from OpenFDA , it will refer NDC Directory of another product with the same original packager ndc */
    if (!ndcDir) {
      if (!package) {
        return;
      }
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
    /* If NDC Directory misses RxCui, it will refer Product Labeling with the same original packager ndc */
    if (!rxcui) {
      if (!product_ndc) {
        return;
      }
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
    /* If Strength is missing, it will straightly create a new document */
    const strength = [];
    if (active_ingredients?.length > 0) {
      active_ingredients.forEach((v) => {
        strength.push(v.strength);
      });
      /* If Alternative already exists and its RxCui array is inclusive */
      let _result = await Alternative.findOne({
        rxcui: { $all: rxcui },
        strength,
      });
      if (_result) {
        if (package) {
          _result = await Alternative.findOneAndUpdate(
            {
              _id: _result._id,
            },
            { $addToSet: { children: package._id } },
            { new: true }
          );
        }
        return _result;
      }
      /* If Alternative already exists but its RxCui array is not inclusive, it has to update Drug rxcui  */
      const result = await Alternative.findOne({
        rxcui: { $in: rxcui },
        strength,
      });
      if (result) {
        const existingRxcui = result.rxcui;
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
            const query = package
              ? { $set: { rxcui }, $addToSet: { children: package._id } }
              : { $set: { rxcui } };
            const _result = await Alternative.findOneAndUpdate(
              { _id: result._id },
              query,
              {
                new: true,
              }
            );
            await createDrug(ndcDir);
            return _result;
          }
        }
      }
    }
    /* else */
    let name = generic_name;
    if (package?.strength) {
      name += ` ${package.strength}`;
    } else if (strength.length > 0) {
      name += ` ${strength
        .map((v, i, a) => {
          let text = v;
          const match = v.match(/([^\d.]+)(.+)/);
          const match2 = a[i + 1]?.match(/([^\d.]+)(.+)/);
          if (match && match2 && match[0] === match2[0]) {
            text = text.substring(0, text.length - match[0].length);
          }
          if (text.startsWith(".")) {
            text = "0" + text;
          }
          if (text.endsWith("/1")) {
            text = text.substring(0, text.length - 2);
          }
          return text;
        })
        .join("-")}`;
    }
    const result = await Alternative.create({
      name,
      rxcui,
      strength,
      children: package ? [package._id] : undefined,
    });
    await createDrug(ndcDir, result._id, rxcui);
    return result;
  } catch (e) {
    console.log(e);
  }
};
