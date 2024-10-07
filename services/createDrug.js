const Drug = require("../schemas/drug");

module.exports = async (ndcDir, alternative_id) => {
  const { brand_name_base, dea_schedule } = ndcDir;
  const { unii, rxcui } = ndcDir.openfda;
  const results = await Drug.find({
    unii: { $all: unii },
  });
  const arr = [];
  if (results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      if (v.unii.length !== unii.length) {
        continue;
      }
      if (v.rxcui.length === rxcui.length) {
        if (v.rxcui.every((w) => rxcui.includes(w))) {
          arr.push(v);
          break;
        }
        continue;
      } else if (v.rxcui.length < rxcui.length) {
        if (v.rxcui.every((w) => rxcui.includes(w))) {
          const result = await Drug.findOneAndUpdate(
            { ...v },
            { $set: { rxcui } },
            { new: true }
          ).catch((e) => {
            console.log(e);
            arr.push(new Error(`Failed to update Drug document ${v._id}`));
          });
          arr.push(result);
          break;
        }
        continue;
      } else {
        if (rxcui.every((w) => v.rxcui.includes(w))) {
          arr.push(v);
          break;
        }
      }
    }
  }
  if (arr.length === 0) {
    return await Drug.create({
      unii,
      rxcui,
      brand_name_base,
      dea_schedule: dea_schedule ?? "0",
      families: alternative_id ? [alternative_id] : [],
    }).catch((e) => {
      console.log(e);
      return e;
    });
  }
  if (alternative_id) {
    return await Drug.findOneAndUpdate(
      {
        ...arr[0],
      },
      { $addToSet: { families: alternative_id } },
      { new: true }
    );
  }
  return arr[0];
};
