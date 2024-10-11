const Drug = require("../schemas/drug");
const Alternative = require("../schemas/alternative");

module.exports = async (ndcDir, alternative_id) => {
  const { generic_name, dea_schedule } = ndcDir;
  const { rxcui } = ndcDir.openfda;
  if (!rxcui) {
    return new Error("RxCUI is missing in the NDC Directory document");
  }
  const _result = await Drug.findOne({ rxcui: { $all: rxcui } }).catch((e) => {
    console.log(e);
  });
  if (_result) {
    if (_result.rxcui.length > rxcui.length) {
      const alt = await Alternative.findOneAndUpdate(
        { _id: alternative_id },
        { $set: { rxcui: _result.rxcui } },
        { new: true }
      ).catch((e) => {
        console.log(e);
        return e;
      });
      if (alt instanceof Error) {
        return alt;
      }
    }
    return await Drug.findOneAndUpdate(
      {
        _id: _result._id,
      },
      { $addToSet: { families: alternative_id } },
      { new: true }
    ).catch((e) => {
      console.log(e);
      return e;
    });
  }

  const results = await Drug.find({ rxcui: { $in: rxcui } });
  let result;
  if (results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      if (results[i].rxcui.every((v) => rxcui.includes(v))) {
        const query = alternative_id
          ? { $set: { rxcui }, $addToSet: { families: alternative_id } }
          : { $set: { rxcui } };
        result = await Drug.findOneAndUpdate({ _id: results[i]._id }, query, {
          new: true,
        }).catch((e) => {
          console.log(e);
          result = e;
        });
        return result;
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
    }).catch((e) => {
      console.log(e);
      return e;
    });
  }
};
