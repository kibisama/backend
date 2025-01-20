const Alternative = require("../../schemas/inventory/alternative");
const Family = require("../../schemas/inventory/family");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");

/**
 * Creates an Alternative and a Family. Creates a Family document if not exists.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    const { SBD, SCD, SBDF, SCDF } = await getAllRelatedInfo(rxcui);
    if (!SBD && !SCD) {
      return;
    }
    const _rxcui = [];
    if (SBD) {
      _rxcui.push(SBD.rxcui);
    }
    if (SCD) {
      _rxcui.push(SCD.rxcui);
    }
    const alt = await Alternative.create({
      name: SBD?.name ?? SCD.name,
      rxcui: _rxcui,
    });
    if (SBDF || SCDF) {
      const rxcui = [];
      if (SBDF) {
        rxcui.push(SBDF.rxcui);
      }
      if (SCDF) {
        rxcui.push(SCDF.rxcui);
      }
      let family = await Family.findOne({ rxcui: { $in: rxcui } });
      if (family) {
        await Family.findOneAndUpdate(
          { _id: family._id },
          { $addToSet: { _rxcui, alternatives: alt._id } }
        );
      } else {
        family = await Family.create({
          name: SBDF?.name ?? SCDF.name,
          rxcui,
          _rxcui,
          alternatives: [alt._id],
        });
      }
      return Alternative.findOneAndUpdate(
        { _id: alt._id },
        { family: family._id }
      );
    }
    return alt;
  } catch (e) {
    console.log(e);
  }
};
