const PLAN = require("../../schemas/drx/plan");

/**
 * @typedef {PLAN.Plan} Plan
 * @typedef {typeof PLAN.schema.obj} PlanObj
 */

/**
 * @param {PlanObj} plan
 * @return {{planID: string}}
 */
const createBase = (plan) => {
  return { planID: plan.planID };
};

module.exports = {
  /**
   * Upserts (or updates if exists) a Plan document.
   * @param {PlanObj} plan
   * @returns {Promise<Plan|undefined>}
   */
  async upsertPlan(plan) {
    try {
      const base = createBase(plan);
      const pl = await PLAN.findOne(base);
      if (pl === null) {
        return await PLAN.create(plan);
      }
      return await PLAN.findByIdAndUpdate(pl._id, plan, { new: true });
    } catch (e) {
      console.log(e);
    }
  },
};
