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
    let _name;
    for (let i = 0; i < fRxcui.length; i++) {
      const result = await getAllRelatedInfo(fRxcui[i]);
      if (result instanceof Error) {
        return;
      }
      const { SBD, SCD, SBDF, SCDF } = result;
      if (SCDF) {
        SCDF.forEach((v) => {
          rxcuiTable[v.rxcui] = true;
          if (!_name) {
            _name = v.name;
          }
        });
      }
      if (SBDF) {
        SBDF.forEach((v) => {
          rxcuiTable[v.rxcui] = true;
          if (!_name) {
            _name = v.name;
          }
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
    const family = await Family.findOneAndUpdate(
      { rxcui: { $in: rxcui } },
      { $addToSet: { rxcui, _rxcui } },
      { new: true }
    );
    if (family) {
      return family;
    }
    return await Family.create({
      rxcui,
      _rxcui,
      _name,
    });
  } catch (e) {
    console.log(e);
  }
};
