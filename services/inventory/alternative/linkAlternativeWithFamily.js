const { Alternative, Family } = require("../../../schemas/inventory");
const createFamily = require("../family/createFamily");

/**
 * Links an Alternative document with a Family document.
 * Creates a Family document if rxcui passed & not exists.
 * @param {Alternative} alternative
 * @param {[string]} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async function link(alternative, rxcui) {
  try {
    const _rxcui = alternative.rxcui;
    const { _id } = alternative;
    if (_rxcui.length === 0) {
      return;
    }
    const query = rxcui
      ? { rxcui: { $in: rxcui }, _rxcui: { $in: _rxcui } }
      : { _rxcui: { $in: _rxcui } };
    const query2 = rxcui
      ? { $addToSet: { alternatives: _id, rxcui, _rxcui } }
      : { $addToSet: { alternatives: _id, _rxcui } };
    const family = await Family.findOneAndUpdate(query, query2);
    if (family) {
      return await Alternative.findOneAndUpdate(
        { _id },
        { family: family._id },
        { new: true }
      );
    } else if (rxcui) {
      const family = await createFamily(rxcui);
      if (family) {
        return await link(alternative);
      }
    } else {
      // create Family by _rxcui
    }
  } catch (e) {
    console.log(e);
  }
};
