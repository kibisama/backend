const { Family } = require("../../../schemas/inventory");
const getAllRelatedInfo = require("../../rxnav/getAllRelatedInfo");

/**
 * Creates a Family document.
 * @param {[string]} fRxcui
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async (fRxcui) => {
  try {
    const rxcuiTable = {};
    const _rxcuiTable = {};
    for (let i = 0; i < fRxcui.length; i++) {
      const result = await getAllRelatedInfo(fRxcui[i]);
      if (result instanceof Error) {
        return;
      }
      const { SBD, SCD, SBDF, SCDF } = result;
      if (SBDF) {
        SBDF.forEach((v) => {
          rxcuiTable[v.rxcui] = true;
        });
      }
      if (SCDF) {
        SCDF.forEach((v) => {
          rxcuiTable[v.rxcui] = true;
        });
      }
      if (SBD) {
        SBD.forEach((v) => {
          _rxcuiTable[v.rxcui] = true;
        });
      }
      if (SCD) {
        SCD.forEach((v) => {
          _rxcuiTable[v.rxcui] = true;
        });
      }
    }
    const rxcui = Object.keys(rxcuiTable);
    const _rxcui = Object.keys(_rxcuiTable);

    return await Family.create({
      rxcui,
      _rxcui,
      _name: SCDF?.[0].name ?? SBDF?.[0].name,
    });
  } catch (e) {
    console.log(e);
  }
};
