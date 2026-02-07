const Plan = require("../../schemas/dRx/plan");

exports.map_fields = {
  PlanID: "planID",
  PlanName: "planName",
  Ansi_Bin: "ansiBin",
  PCN: "pcn",
};

/**
 * @param {Plan.DRxPlanSchema}
 * @returns {Promise<Plan.DRxPlan>}
 */
exports.upsertPlan = async (planSchema) => {
  const { planID } = planSchema;
  if (!planID) {
    throw { status: 400 };
  }
  return await Plan.findOneAndUpdate(
    { planID },
    { $set: planSchema },
    { runValidators: true, new: true, upsert: true }
  );
};
