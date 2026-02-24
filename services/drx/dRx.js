const mongoose = require("mongoose");
const DRx = require("../../schemas/dRx/dRx");
const pt = require("./patient");
const pl = require("./plan");

const dayjs = require("dayjs");

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
 * @param {DRx|DRxSchema} dRx
 * @returns {Boolean}
 */
exports.isFileOnly = (dRx) => {
  switch (dRx.rxStatus) {
    case "FILEONLY":
    case "DC-FILEONLY":
    case "FO-TRANSFERRED":
    case "FUTURE BILL":
      return true;
    default:
      return false;
  }
};
/**
 * @param {DRx|DRxSchema} dRx
 * @returns {Boolean}
 */
exports.isBilled = (dRx) => {
  if (dRx.rxStatusFin === "BILLED") {
    return true;
  }
  return false;
};
/**
 * @param {DRx|DRxSchema} dRx
 * @returns {Boolean}
 */
exports.hasNoCopay = (dRx) => {
  if (dRx.patPay === "0") {
    return true;
  }
  return false;
};
/**
 * @param {DRx|DRxSchema} dRx
 * @returns {Boolean}
 */
exports.isRxOnly = (dRx) => {
  if (dRx.drugRxOTC === "RX") {
    return true;
  }
  return false;
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
        ptSchema[field] = data[ptIndexTable[field]];
      }
      const planSchema = {};
      for (const field in planIndexTable) {
        planSchema[field] = data[planIndexTable[field]];
      }
      const dRxSchema = {};
      for (const field in dRxIndexTable) {
        dRxSchema[field] = data[dRxIndexTable[field]];
      }
      if (!ptIdTable[ptSchema.patientID]) {
        ptIdTable[ptSchema.patientID] = await pt.upsertPatient(ptSchema);
      }
      if (!planIdTable[planSchema.planID]) {
        planIdTable[planSchema.planID] = await plan.upsertPlan(planSchema);
      }
      dRxSchema.patient = ptIdTable[ptSchema.patientID];
      dRxSchema.plan = planIdTable[planSchema.planID];
      await exports.upsertDRx(dRxSchema);
      n++;
    }
    return n;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {import("../apps/delivery").DeliveryStation|ObjectId|string} deliveryStation
 * @param {import("../../schemas/apps/deliveryLog").DeliveryLog|ObjectId} [deliveryLog]
 * @param {string} [deliveryDate] MMDDYYYY
 * @returns {Promise<[DRx]|undefined>}
 */
exports.findDRxByStation = async (
  deliveryStation,
  deliveryLog,
  deliveryDate,
) => {
  const day = deliveryDate ? dayjs(deliveryDate, "MMDDYYYY") : dayjs();
  const filter = {
    $and: [
      { deliveryStation },
      { deliveryDate: { $gte: day.startOf("day"), $lte: day.endOf("day") } },
    ],
  };
  if (deliveryLog) {
    filter.$and.push({ deliveryLog });
  } else {
    filter.$and.push({ deliveryLog: { $exists: false } });
  }
  try {
    return await DRx.find(filter);
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

/**
 * @typedef {object} Data
 * @property {import("../../schemas/dRx/patient").DRxPatientSchema} patientSchema
 * @property {import("../../schemas/dRx/plan").DRxPlanSchema} planSchema
 * @property {import("../../schemas/dRx/dRx").DRxSchema} dRxSchema
 */

/**
 * @param {string} qr
 * @param {string} delimiter
 * @returns {Data}
 */
exports.decodeQR = (qr, delimiter) => {
  const [
    rxID,
    rxNumber,
    rxDate,
    patientID,
    patientLastName,
    patientFirstName,
    drugName,
    doctorName,
    rxQty,
    refills,
    planID,
    patPay,
  ] = qr.split(delimiter).map((v) => v.trim());
  if (
    !(
      rxID &&
      rxNumber &&
      rxDate &&
      patientID &&
      patientLastName &&
      patientFirstName &&
      drugName &&
      doctorName &&
      rxQty &&
      refills
    )
  ) {
    throw { status: 400 };
  }
  return {
    dRxSchema: {
      rxID,
      rxNumber,
      rxDate,
      drugName,
      doctorName,
      rxQty,
      refills,
      patPay,
    },
    patientSchema: { patientID, patientLastName, patientFirstName },
    planSchema: { planID },
  };
};

/**
 * @param {Data} data
 * @returns {Promise<DRx.DRx>}
 */
exports.upsertDRx = async (data) => {
  const { patientSchema, planSchema, dRxSchema } = data;
  const patient = await pt.upsertPatient(patientSchema);
  let plan;
  if (planSchema?.planID) {
    plan = await pl.upsertPlan(planSchema);
  }
  return await DRx.findOneAndUpdate(
    { rxID: dRxSchema.rxID },
    { $set: { ...dRxSchema, patient: patient._id, plan: plan?._id } },
    { runValidators: true, new: true, upsert: true },
  );
};

/**
 * @param {string} rxID
 * @returns {Promise<DRx.DRx|null>}
 */
exports.findDRxByRxID = async (rxID) => {
  if (!rxID) {
    throw { status: 400 };
  }
  return await DRx.findOne({ rxID });
};

/**
 * @param {DRx.DRx} dRx
 * @param {string|mongoose.ObjectId} station
 * @param {Date} [deliveryDate]
 * @returns {Promise<DRx.DRx>}
 */
exports.setDelivery = async (dRx, station, deliveryDate = new Date()) => {
  if (!mongoose.isValidObjectId(station)) {
    throw { status: 400 };
  }
  dRx.deliveryStation = station;
  dRx.deliveryDate = deliveryDate;
  return await dRx.save();
};

/**
 * @param {string|mongoose.ObjectId} deliveryStation
 * @param {dayjs.Dayjs} [day]
 * @returns {Promise<DRx.DRx[]>}
 */
exports.findDRxesOnStage = async (deliveryStation, day) => {
  var day = day || dayjs();
  return await DRx.find({
    deliveryDate: { $gte: day.startOf("d"), $lte: day.endOf("d") },
    deliveryStation,
    deliveryLog: { $exists: false },
  });
};

/**
 * Returns the original document
 * @param {DRx.DRx} dRx
 * @returns {Promise<DRx.DRx>}
 */
exports.unsetDelivery = async (dRx) => {
  if (!dRx.deliveryLog) {
    const updated = await DRx.findOneAndUpdate(
      { _id: dRx._id, __v: dRx.__v },
      { $unset: { deliveryStation: 1, deliveryDate: 1 } },
    );
    if (updated) return updated;
  }
  throw { status: 409 };
};

/**
 * Returns the original document
 * @param {DRx.DRx} dRx
 * @param {Promise<DRx.DRx>}
 */
exports.returnDelivery = async (dRx) => {
  if (dRx.deliveryLog) {
    const updated = await DRx.findOneAndUpdate(
      { _id: dRx._id, __v: dRx.__v },
      {
        $push: { logHistory: dRx.deliveryLog, returnDates: new Date() },
        $unset: { deliveryLog: 1, deliveryStation: 1, deliveryDate: 1 },
      },
    );
    if (updated) return updated;
  }
  throw { status: 409 };
};

/**
 * At least one of the params is required
 * @param {string} [rxNumber]
 * @param {ObjectId|string} [patient]
 * @returns {Promise<DRx[]>}
 */
exports.searchDRxWithRxNumberOrPatient = async (rxNumber, patient) => {
  isValidPatient = mongoose.isValidObjectId(patient);
  if (!(rxNumber || isValidPatient)) {
    throw { status: 400 };
  }
  const $and = [];
  rxNumber && $and.push({ rxNumber });
  isValidPatient && $and.push({ patient });
  return await DRx.find({ $and }).sort({ deliveryDate: -1 });
};
