const { Alternative } = require("../../../schemas/inventory");
const linkAlternativeWithFamily = require("./linkAlternativeWithFamily");
const getAllRelatedInfo = require("../../rxnav/getAllRelatedInfo");

/**
 * Creates an Alternative document.
 * @param {string} rxcui SBD or SCD
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await getAllRelatedInfo(rxcui);
    if (result instanceof Error) {
      return;
    }
    const { SBD, SCD, SBDF, SCDF } = result;
    const _rxcui = [];
    if (SBD) {
      SBD.forEach((v) => _rxcui.push(v.rxcui));
    }
    if (SCD) {
      SCD.forEach((v) => _rxcui.push(v.rxcui));
    }
    let alt;
    const _alt = await Alternative.findOne({ rxcui: { $in: _rxcui } });
    if (_alt) {
      alt = await Alternative.findOneAndUpdate(
        { _id: _alt._id },
        {
          $addToSet: { rxcui: _rxcui },
        },
        { new: true }
      );
    } else {
      alt = await Alternative.create({
        rxcui: _rxcui,
        _name: SCD?.[0].name ?? SBD?.[0].name,
      });
    }
    const fRxcui = [];
    if (SCDF) {
      SCDF.forEach((v) => fRxcui.push(v.rxcui));
    }
    if (SBDF) {
      SBDF.forEach((v) => fRxcui.push(v.rxcui));
    }
    return await linkAlternativeWithFamily(alt, fRxcui);
  } catch (e) {
    console.log(e);
  }
};
