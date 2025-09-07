const PsAlt = require("../../schemas/ps/psAlternative");

/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {PsAlt.PsAlternative} PsAlternative
 * @typedef {import("../inv/alternative").Alternative} Alternative
 * @typedef {PsAlt.Result} Result
 * @typedef {Parameters<PsAlt["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<PsAlt["findOneAndUpdate"]>["1"]} UpdateParam
 */
/**
 * Upserts an PsAlternative document.
 * @param {Alternative|ObjectId} alternative
 * @returns {Promise<PsAlternative|undefined>}
 */
exports.upsertPsAlternative = async (alternative) => {
  try {
    const psAlt = await PsAlt.findOneAndUpdate(
      { alternative },
      {},
      { new: true, upsert: true }
    );
    return psAlt;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {PsAlternative} alt
 * @param {[Result]} items
 * @returns {Promise<void>}
 */
exports.updatePsPackageCallback = async (alt, items) => {
  try {
    await alt.updateOne({
      $set: { lastUpdated: new Date(), active: true, items },
    });
  } catch (e) {
    console.error(e);
  }
};
