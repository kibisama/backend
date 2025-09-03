// const PLAN = require("../../schemas/dRx/plan");

// /**
//  * @typedef {PLAN.Plan} Plan
//  * @typedef {typeof PLAN.schema.obj} PlanObj
//  */

// /**
//  * @param {[string]} csvHeader
//  * @returns {Object<string, number>}
//  */
// exports.mapIndex = (csvHeader) => {
//   const table = {};
//   csvHeader.forEach((v, i) => {
//     table[v] = i;
//   });
//   return {
//     planID: table.PlanID,
//     planName: table.PlanName,
//     ansiBin: table.Ansi_Bin,
//     pcn: table.PCN,
//   };
// };

// /**
//  * @param {ReturnType<mapIndex>} indexTable
//  * @param {[string]} rxReportRow
//  * @returns {PlanObj}
//  */
// exports.createPlanObj = (indexTable, rxReportRow) => {
//   const planObj = {};
//   Object.keys(indexTable).forEach((v) => {
//     planObj[v] = rxReportRow[indexTable[v]].trim();
//   });
//   return planObj;
// };

// /**
//  * @param {PlanObj} planObj
//  * @returns {Promise<Plan|undefined>}
//  */
// exports.upsertPlan = async (planObj) => {
//   try {
//     const planID = planObj.planID;
//     if (!planID) {
//       throw new Error();
//     }
//     return await PLAN.findOneAndUpdate(
//       { planID },
//       { $set: planObj },
//       { new: true, upsert: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };
