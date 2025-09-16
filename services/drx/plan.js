const Plan = require("../../schemas/dRx/plan");

/**
 * @typedef {Plan.DRxPlan} Plan
 * @typedef {typeof Plan.schema.obj} PlanSchema
 */

exports.map_fields = {
  PlanID: "planID",
  PlanName: "planName",
  Ansi_Bin: "ansiBin",
  PCN: "pcn",
};

/**
 * @param {PlanSchema} planSchema
 * @returns {Promise<DRx|undefined>}
 */
exports.upsertPlan = async (planSchema) => {
  try {
    const { planID } = planSchema;
    if (!planID) {
      return;
    }
    return await Plan.findOneAndUpdate(
      { planID },
      { $set: planSchema },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};
