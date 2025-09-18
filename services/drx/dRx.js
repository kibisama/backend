const DRx = require("../../schemas/dRx/dRx");
const pt = require("./patient");
const plan = require("./plan");

/**
 * @typedef {DRx.DigitalRx} DRx
 * @typedef {DRx.RxStatus} RxStatus
 * @typedef {DRx.RxStatusFin} RxStatusFin
 * @typedef {typeof DRx.schema.obj} DRxSchema
 * @typedef {import("mongoose").ObjectId} ObjectId
 */

exports.map_fields = {
  /* Rx data */
  RxID: "rxID",
  CreatedDate: "createdDate",
  createdby: "createdBy",
  RxNumber: "rxNumber",
  FillNo: "fillNo",
  RxDateWritten: "rxDateWritten",
  Effectivedate: "effectiveDate",
  NextFillDate: "nextFillDate",
  RxDate: "rxDate",
  DeliveredDate: "deliveredDate",
  Daw: "daw",
  Sig: "sig",
  QtyWritten: "qtyWritten",
  Refills: "refills",
  RxQty: "rxQty",
  QtyRemaining: "qtyRemaining",
  Dayssupply: "daysSupply",
  RxOrigCode: "rxOrigCode",
  RxNotes: "rxNotes",
  RxStatus: "rxStatus",
  RxStatusFin: "rxStatusFin",
  /* Doctor data */
  DoctorName: "doctorName",
  DoctorNPI: "doctorNPI",
  DoctorDea: "doctorDEA",
  /* Drug data */
  DrugName: "drugName",
  DrugNDC: "drugNDC",
  DrugDea: "drugDEA",
  DrugRxOTC: "drugRxOTC",
  ["Brand/Generic"]: "bG",
  GenericFor: "genericFor",
  /* Payment data */
  TotalPaid: "totalPaid",
  PatPAy: "patPay",
  InsPaid: "insPaid",
  DispFeePaid: "dispFeePaid",
  /* Insurance data */
  Insured_id: "insuredID",
  CardNumber: "cardNumber",
  GroupNumber: "groupNumber",
};

/**
 * Returns an array of strings of all required fields for importing a csv file.
 * @returns {[string]}
 */
exports.getRequiredFields = () => {
  return [
    ...Object.keys(exports.map_fields),
    ...Object.keys(pt.map_fields),
    ...Object.keys(plan.map_fields),
  ];
};

/**
 * @param {[string]} csvHeader
 * @returns {boolean}
 */
exports.verifyFields = (csvHeader) => {
  const table = {};
  csvHeader.forEach((v) => (table[v] = true));
  const reqFields = exports.getRequiredFields();
  for (let i = 0; i < reqFields.length; i++) {
    if (!table[reqFields[i]]) {
      return false;
    }
  }
  return true;
};

/**
 * @param {DRxSchema} dRxSchema
 * @returns {Promise<DRx|undefined>}
 */
const upsertDRx = async (dRxSchema) => {
  try {
    const { rxID } = dRxSchema;
    if (!rxID) {
      return;
    }
    return await DRx.findOneAndUpdate(
      { rxID },
      { $set: dRxSchema },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};

/**
 * Upserts dRx documents from a CSV json.
 * @param {[[string]]} csvData
 * @returns {Promise<number|void>}
 */
exports.importDRxs = async (csvData) => {
  try {
    const csvHeader = csvData[0];
    const dRxIndexTable = {};
    const ptIndexTable = {};
    const planIndexTable = {};
    csvHeader.forEach((v, i) => {
      if (exports.map_fields[v]) {
        dRxIndexTable[exports.map_fields[v]] = i;
      } else if (pt.map_fields[v]) {
        ptIndexTable[pt.map_fields[v]] = i;
      } else if (plan.map_fields[v]) {
        planIndexTable[plan.map_fields[v]] = i;
      }
    });
    const ptIdTable = {};
    const planIdTable = {};
    let n = 0;
    for (let i = 1; i < csvData.length; i++) {
      const data = csvData[i];
      const ptSchema = {};
      for (const field in ptIndexTable) {
        ptSchema[field] = data[ptIndexTable[field]].trim();
      }
      const planSchema = {};
      for (const field in planIndexTable) {
        planSchema[field] = data[planIndexTable[field]].trim();
      }
      const dRxSchema = {};
      for (const field in dRxIndexTable) {
        dRxSchema[field] = data[dRxIndexTable[field]].trim();
      }
      if (!ptIdTable[ptSchema.patientID]) {
        ptIdTable[ptSchema.patientID] = await pt.upsertPatient(ptSchema);
      }
      if (!planIdTable[planSchema.planID]) {
        planIdTable[planSchema.planID] = await plan.upsertPlan(planSchema);
      }
      dRxSchema.patient = ptIdTable[ptSchema.patientID];
      dRxSchema.plan = planIdTable[planSchema.planID];
      await upsertDRx(dRxSchema);
      n++;
    }
    return n;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {[string]} a
 * @param {string} [station]
 * @returns {Promise<DRx|undefined>}
 */
exports.upsertWithQR = async (a, station) => {
  try {
    const _pt = await pt.upsertPatient({
      patientID: a[3],
      patientLastName: a[4],
      patientFirstName: a[5],
    });
    const _plan = await plan.upsertPlan({ planID: a[9] });
    const dRxSchema = {
      rxID: a[0],
      rxNumber: a[1],
      rxDate: a[2],
      drugName: a[6],
      rxQty: a[7],
      refills: a[8],
      patPay: a[10],
      patient: _pt._id,
      plan: _plan._id,
    };
    station && (dRxSchema.deliveryStation = station);
    return await upsertDRx(dRxSchema);
  } catch (e) {
    console.error(e);
  }
};

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
