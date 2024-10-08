const Alternative = require("../schemas/alternative");
const createDrug = require("../services/createDrug");

module.exports = async (ndcDir, package_id) => {
  const { active_ingredients, brand_name_base } = ndcDir;
  const strength = [];
  active_ingredients.forEach((v) => {
    strength.push(v.strength);
  });
  const { unii, rxcui } = ndcDir.openfda;
  const _result = await Alternative.findOne({
    unii: { $all: unii, $size: unii.length },
    rxcui: { $all: rxcui, $size: rxcui.length },
    brand_name_base,
    strength: { $all: strength, $size: strength.length },
  }).catch((e) => {
    console.log(e);
    return e;
  });
  if (_result) {
    if (package_id) {
      return await Alternative.findOneAndUpdate(
        {
          id_: _result._id,
        },
        { $addToSet: { alternatives: package_id } },
        { new: true }
      ).catch((e) => {
        console.log(e);
        return e;
      });
    }
    return _result;
  }
  const result = await Alternative.create({
    unii,
    rxcui,
    brand_name_base,
    strength,
    alternatives: package_id ? [package_id] : [],
  }).catch((e) => {
    console.log(e);
    return e;
  });
  const drug = await createDrug(ndcDir, result._id);
  if (drug instanceof Error) {
    return drug;
  }
  return result;
};
