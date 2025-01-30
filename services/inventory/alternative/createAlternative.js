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
    const { SBD, SCD, SBDF, SCDF, DF } = await getAllRelatedInfo(rxcui);
    const _rxcui = [];
    if (SBD) {
      _rxcui.push(SBD[0].rxcui);
    }
    if (SCD) {
      _rxcui.push(SCD[0].rxcui);
    }
    const alt = await Alternative.create({
      rxcui: _rxcui,
      _name: SBD?.[0].name ?? SCD[0].name,
      form: DF?.[0].name,
    });
    return await linkAlternativeWithFamily(
      alt,
      SBDF?.[0].rxcui ?? SCDF[0].rxcui
    );
  } catch (e) {
    console.log(e);
  }
};
