const Package = require("../schemas/package");
const Alternative = require("../schemas/alternative");
const createDrug = require("../services/createDrug");

module.exports = async (ndcDir, package_id) => {
  const { active_ingredients, generic_name } = ndcDir;
  const strength = [];

  // Default name generation
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

  const { rxcui } = ndcDir.openfda;
  if (!rxcui) {
    return new Error("RxCUI is missing in the NDC Directory document");
  }
  const results = await Alternative.find({
    rxcui: { $in: rxcui },
    strength,
  }).catch((e) => {
    console.log(e);
    return e;
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
          ).catch((e) => {
            console.log(e);
            return e;
          });
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
    }).catch((e) => {
      console.log(e);
      return e;
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
    ).catch((e) => {
      console.log(e);
    });
  }
  const drug = await createDrug(ndcDir, result._id);
  if (drug instanceof Error) {
    return drug;
  }
  return result;
};
