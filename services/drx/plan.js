const PLAN = require("../../schemas/dRx/plan");

/**
 * @typedef {PLAN.Plan} Plan
 * @typedef {typeof PLAN.schema.obj} PlanObj
 */

/**
 * @param {[string]} csvHeader
 * @returns {Object<string, number>}
 */
exports.mapIndex = (csvHeader) => {
  const table = {};
  csvHeader.forEach((v, i) => {
    table[v] = i;
  });
  return {
    planID: table.PlanID,
    planName: table.PlanName,
    ansiBin: table.Ansi_Bin,
    pcn: table.PCN,
  };
};

/**
 * @param {ReturnType<mapIndex>} indexTable
 * @param {[string]} rxReportRow
 * @returns {PlanObj}
 */
exports.createPlanObj = (indexTable, rxReportRow) => {
  const planObj = {};
  Object.keys(indexTable).forEach((v) => {
    planObj[v] = rxReportRow[indexTable[v]];
  });
};

/**
 * @param {PlanObj} planObj
 * @return {Promise<Plan|undefined>}
 */
const _findPlan = async (planObj) => {
  try {
    if (!planObj.planID) {
      throw new Error();
    }
    return await PLAN.find({ planID: planObj.planID });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {PlanObj} planObj
 * @return {Promise<Plan|undefined>}
 */
const _createPlan = async (planObj) => {
  try {
    return await PLAN.create(planObj);
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {PlanObj} planObj
 * @returns {Promise<Plan|undefined>}
 */
exports.upsertPlan = async (planObj) => {
  try {
    const plan = await _findPlan(planObj);
    if (!plan) {
      return await _createPlan(planObj);
    }
    return plan;
  } catch (e) {
    console.log(e);
  }
};
