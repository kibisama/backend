// const DRX = require("../../schemas/dRx/dRx");
// const pt = require("./patient");
// const plan = require("./plan");
// const { upsertPackage } = require("../inv/package");
// const { hasUndefinedProperties } = require("../common");
// const { hyphenateNDC11 } = require("../convert");

// /**
//  * @typedef {DRX.DigitalRx} DRx
//  * @typedef {DRX.RxStatus} RxStatus
//  * @typedef {DRX.RxStatusFin} RxStatusFin
//  * @typedef {typeof DRX.schema.obj} DRxObj
//  */

// const _mapIndex = (csvHeader) => {
//   const table = {};
//   csvHeader.forEach((v, i) => {
//     table[v] = i;
//   });
//   return {
//     /* Rx data */
//     rxID: table.RxID,
//     createdDate: table.CreatedDate,
//     createdBy: table.createdby,
//     rxNumber: table.RxNumber,
//     fillNo: table.FillNo,
//     rxDateWritten: table.RxDateWritten,
//     effectiveDate: table.Effectivedate,
//     nextFillDate: table.NextFillDate,
//     rxDate: table.RxDate,
//     deliveredDate: table.DeliveredDate,
//     daw: table.Daw,
//     sig: table.Sig,
//     qtyWritten: table.QtyWritten,
//     refills: table.Refills,
//     rxQty: table.RxQty,
//     qtyRemaining: table.QtyRemaining,
//     daysSupply: table.Dayssupply,
//     rxOrigCode: table.RxOrigCode,
//     rxNotes: table.RxNotes,
//     rxStatus: table.RxStatus,
//     rxStatusFin: table.RxStatusFin,
//     /* Doctor data */
//     doctorName: table.DoctorName,
//     doctorNPI: table.DoctorNPI,
//     doctorDEA: table.DoctorDea,
//     /* Drug data */
//     drugName: table.DrugName,
//     drugNDC: table.DrugNDC,
//     drugDEA: table.DrugDea,
//     drugRxOTC: table.DrugRxOTC,
//     bG: table["Brand/Generic"],
//     genericFor: table.GenericFor,
//     /* Payment data */
//     totalPaid: table.TotalPaid,
//     patPay: table.PatPAy,
//     insPaid: table.InsPaid,
//     dispFeePaid: table.DispFeePaid,
//     /* Insurance data */
//     insuredID: table.Insured_id,
//     cardNumber: table.CardNumber,
//     groupNumber: table.GroupNumber,
//   };
// };

// /**
//  * @param {string} data
//  * @param {string} delimiter
//  * @param {string} deliveredTo
//  * @returns {Promise<undefined>}
//  */
// exports.upsertWithQR = async (data, delimiter, deliveredTo) => {
//   try {
//     const a = data.split(delimiter);
//     const patient = await pt.upsertPatient({
//       patientID: a[3],
//       patientLastName: a[4],
//       patientFirstName: a[5],
//       patientDOB: a[6],
//       lastLocation: deliveredTo,
//     });
//     await _upsertDRx({
//       rxID: a[0],
//       rxNumber: a[1],
//       rxDate: a[2],
//       drugNDC: a[7],
//       drugName: a[8],
//       rxQty: a[9],
//       refills: a[10],
//       doctorName: a[11],
//       patPay: a[12],
//       patient: patient._id,
//       deliveredTo,
//     });
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {ReturnType<_mapIndex>} indexTable
//  * @param {[string]} rxReportRow
//  * @returns {DRxObj}
//  */
// const _createDRxObj = (indexTable, rxReportRow) => {
//   const dRxObj = {};
//   Object.keys(indexTable).forEach((v) => {
//     dRxObj[v] = rxReportRow[indexTable[v]].trim();
//   });
//   return dRxObj;
// };

// /**
//  * Also Updates the document.
//  * @param {DRxObj} dRxObj
//  * @returns {Promise<DRx|undefined>}
//  */
// const _upsertDRx = async (dRxObj) => {
//   try {
//     const rxID = dRxObj.rxID;
//     if (!rxID) {
//       throw new Error();
//     }
//     return await DRX.findOneAndUpdate(
//       { rxID },
//       { $set: dRxObj },
//       { new: true, upsert: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {DRxObj} dRxObj
//  * @returns {undefined}
//  */
// const _upsertPackage = (dRxObj) => {
//   !exports.isFileOnly(dRxObj) &&
//     exports.isRxOnly(dRxObj) &&
//     upsertPackage(hyphenateNDC11(dRxObj.drugNDC), "ndc11");
// };

// /**
//  * Upserts & updates dRx documents thoroughly from the whole CSV Json.
//  * @param {[[string]]} csvData
//  * @returns {Promise<|undefined>}
//  */
// exports.upsertManyRx = async (csvData) => {
//   try {
//     const csvHeader = csvData[0];
//     const dRxMap = _mapIndex(csvHeader);
//     const ptMap = pt.mapIndex(csvHeader);
//     const planMap = plan.mapIndex(csvHeader);
//     /** @type {Object<string, pt.Patient>} */
//     const ptTable = {};
//     /** @type {Object<string, plan.Plan>} */
//     const planTable = {};
//     /** @type {Object<string, string>} */
//     const packageTable = {};
//     for (let i = 1; i < csvData.length; i++) {
//       const data = csvData[i];
//       const dRxObj = _createDRxObj(dRxMap, data);
//       const dRx = await _upsertDRx(dRxObj);
//       const ptObj = pt.createPtObj(ptMap, data);
//       if (!ptTable[ptObj.patientID]) {
//         ptTable[ptObj.patientID] = await pt.upsertPatient(ptObj);
//         await dRx.updateOne({ patient: ptTable[ptObj.patientID]._id });
//       }
//       const planObj = plan.createPlanObj(planMap, data);
//       if (planObj.planID && !planTable[planObj.planID]) {
//         planTable[planObj.planID] = await plan.upsertPlan(planObj);
//         await dRx.updateOne({ plan: planTable[planObj.planID]._id });
//       }
//       if (!packageTable[dRxObj.drugNDC]) {
//         packageTable[dRxObj.drugNDC] = true;
//         _upsertPackage(dRxObj);
//       }
//     }
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * Checks if the CSV header contains all required.
//  * @param {[string]} csvHeader
//  * @returns {boolean}
//  */
// exports.checkCSVHeader = (csvHeader) => {
//   const maps = [
//     _mapIndex(csvHeader),
//     pt.mapIndex(csvHeader),
//     plan.mapIndex(csvHeader),
//   ];
//   for (let i = 0; i < maps.length; i++) {
//     if (hasUndefinedProperties(maps[i])) {
//       return false;
//     }
//   }
//   return true;
// };

// /**
//  * @param {DRxObj} dRx
//  * @returns {Boolean}
//  */
// exports.isFileOnly = (dRx) => {
//   /** @type {RxStatus} */
//   const rxStatus = dRx.rxStatus;
//   switch (rxStatus) {
//     case "FILEONLY":
//     case "DC-FILEONLY":
//     case "FO-TRANSFERRED":
//     case "FUTURE BILL":
//       return true;
//     default:
//       return false;
//   }
// };
// /**
//  * @param {DRxObj} dRx
//  * @returns {Boolean}
//  */
// exports.isBilled = (dRx) => {
//   if (dRx.rxStatusFin === "BILLED") {
//     return true;
//   }
//   return false;
// };
// /**
//  * @param {DRxObj} dRx
//  * @returns {Boolean}
//  */
// exports.hasNoCopay = (dRx) => {
//   if (dRx.patPay === "0") {
//     return true;
//   }
//   return false;
// };
// /**
//  * @param {DRxObj} dRx
//  * @returns {Boolean}
//  */
// exports.isRxOnly = (dRx) => {
//   if (dRx.drugRxOTC === "RX") {
//     return true;
//   }
//   return false;
// };
