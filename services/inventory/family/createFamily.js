const { Family } = require("../../../schemas/inventory");
const getAllRelatedInfo = require("../../rxnav/getAllRelatedInfo");

/**
 * Creates a Family document.
 * @param {string} fRxcui SBDF or SCDF
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async (fRxcui) => {
  try {
    const { SBD, SCD, SBDF, SCDF } = await getAllRelatedInfo(fRxcui);
    const rxcui = [];
    if (SBDF) {
      rxcui.push(SBDF[0].rxcui);
    }
    if (SCDF) {
      rxcui.push(SCDF[0].rxcui);
    }
    const _rxcui = [];
    SBD.forEach((v) => _rxcui.push(v.rxcui));
    SCD.forEach((v) => _rxcui.push(v.rxcui));
    return await Family.create({
      rxcui,
      _rxcui,
      _name: SBDF?.[0].name ?? SCDF[0].name,
    });
  } catch (e) {
    console.log(e);
  }
};
