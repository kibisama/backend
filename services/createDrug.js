const Drug = require("../schemas/drug");

module.exports = async (ndcDir, alternative_id) => {
  const { generic_name, dea_schedule } = ndcDir;
  const { unii, rxcui } = ndcDir.openfda;
  const results = await Drug.find({
    unii: { $all: unii, $size: unii.length },
  });
  const arr = [];
  if (results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      if (results[i].rxcui.length === rxcui.length) {
        if (results[i].rxcui.every((v) => rxcui.includes(v))) {
          arr.push(results[i]);
          break;
        }
        continue;
      } else if (results[i].rxcui.length < rxcui.length) {
        if (results[i].rxcui.every((v) => rxcui.includes(v))) {
          const result = await Drug.findOneAndUpdate(
            { _id: results[i]._id },
            { $set: { rxcui } },
            { new: true }
          ).catch((e) => {
            console.log(e);
            arr.push(
              new Error(`Failed to update Drug document ${results[i]._id}`)
            );
          });
          arr.push(result);
          break;
        }
        continue;
      } else {
        if (rxcui.every((v) => results[i].rxcui.includes(v))) {
          arr.push(results[i]);
          break;
        }
      }
    }
  }
  if (arr.length === 0) {
    return await Drug.create({
      unii,
      rxcui,
      generic_name,
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
        _id: arr[0]._id,
      },
      { $addToSet: { families: alternative_id } },
      { new: true }
    );
  }
  return arr[0];
};
