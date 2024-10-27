const Drug = require("../../schemas/inventory/drug");
const Alternative = require("../../schemas/inventory/alternative");

module.exports = async (ndcDir, alternative_id) => {
  try {
    const { generic_name, dea_schedule } = ndcDir;
    const { rxcui } = ndcDir.openfda;
    if (!rxcui) {
      return;
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
        if (results[i].rxcui.every((v) => rxcui.includes(v))) {
          const query = alternative_id
            ? { $set: { rxcui }, $addToSet: { families: alternative_id } }
            : { $set: { rxcui } };
          result = await Drug.findOneAndUpdate({ _id: results[i]._id }, query, {
            new: true,
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
      });
    }
  } catch (e) {
    console.log(e);
  }
};
