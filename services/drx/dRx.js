const dayjs = require("dajys");
const DRX = require("../../schemas/dRx/dRx");
const pt = require("./patient");
const plan = require("./plan");

/**
 * @typedef {DRX.DigitalRx} DRx
 * @typedef {DRX.RxStatus} RxStatus
 * @typedef {DRX.RxStatusFin} RxStatusFin
 * @typedef {typeof DRX.schema.obj} DRxObj
 */

const _mapIndex = (csvHeader) => {
  const table = {};
  csvHeader.forEach((v, i) => {
    table[v] = i;
  });
  return {
    /* Rx data */
    rxID: table.RxID,
    createdDate: table.CreatedDate,
    createdBy: table.createdby,
    rxNumber: table.RxNumber,
    fillNo: table.FillNo,
    rxDateWritten: table.RxDateWritten,
    effectiveDate: table.Effectivedate,
    nextFillDate: table.NextFillDate,
    rxDate: table.RxDate,
    deliveredDate: table.DeliveredDate,
    daw: table.Daw,
    sig: table.Sig,
    qtyWritten: table.QtyWritten,
    refills: table.Refills,
    rxQty: table.RxQty,
    qtyRemaining: table.QtyRemaining,
    daysSupply: table.Dayssupply,
    rxOrigCode: table.RxOrigCode,
    rxNotes: table.RxNotes,
    rxStatus: table.RxStatus,
    rxStatusFin: table.RxStatusFin,
    /* Doctor data */
    doctorName: table.DoctorName,
    doctorNPI: table.DoctorNPI,
    doctorDEA: table.DoctorDea,
    /* Drug data */
    drugName: table.DrugName,
    drugNDC: table.DrugNDC,
    drugDEA: table.DrugDea,
    drugRxOTC: table.DrugRxOTC,
    bG: table["Brand/Generic"],
    genericFor: table.GenericFor,
    /* Payment data */
    totalPaid: table.TotalPaid,
    patPay: table.PatPAy,
    insPaid: table.InsPaid,
    dispFeePaid: table.DispFeePaid,
    /* Insurance data */
    insuredID: table.Insured_id,
    cardNumber: table.CardNumber,
    groupNumber: table.GroupNumber,
  };
};

/**
 * @param {ReturnType<mapIndex>} indexTable
 * @param {[string]} rxReportRow
 * @returns {DRxObj}
 */
const _createDRxObj = (indexTable, rxReportRow) => {
  const dRxObj = {};
  Object.keys(indexTable).forEach((v) => {
    ptObj[v] = rxReportRow[indexTable[v]];
  });
};

/**
 * @param {DRxObj} dRxObj
 * @return {Promise<DRx|undefined>}
 */
const _findDRx = async (dRxObj) => {
  try {
    if (!dRxObj.rxID) {
      throw new Error();
    }
    return await DRX.find({ rxID: dRxObj.rxID });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {DRxObj} dRxObj
 * @return {Promise<DRx|undefined>}
 */
const _createDRx = async (dRxObj) => {
  try {
    return await DRX.create(dRxObj);
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {DRxObj} dRxObj
 * @param {DRx} dRx
 * @return {Promise<DRx|undefined>}
 */
const _updateDRx = async (dRxObj, dRx) => {
  try {
    let change = false;
    const keys = Object.keys(dRxObj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (dRx[key] !== dRxObj[key]) {
        change = true;
        break;
      }
    }
    if (change) {
      return await DRX.findByIdAndUpdate(dRx._id, dRxObj, { new: true });
    }
    return dRx;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Also Updates the document.
 * @param {DRxObj} dRxObj
 * @returns {Promise<DRx|undefined>}
 */
const _upsertDRx = async (dRxObj) => {
  try {
    const dRx = await _findDRx(dRxObj);
    if (!dRx) {
      return await _createDRx(dRxObj);
    }
    return await _updateDRx(dRxObj, dRx);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Upserts & updates dRx documents thoroughly from the whole CSV Json.
 * @param {[[string]]} csvData
 * @returns {Promise<|undefined>}
 */
exports.upsertManyRx = async (csvData) => {
  try {
    const csvHeader = csvData[0];
    const dRxMap = _mapIndex(csvHeader);
    const ptMap = pt.mapIndex(csvHeader);
    const planMap = plan.mapIndex(csvHeader);
    /** @type {Object<string, pt.Patient>} */
    const ptTable = {};
    /** @type {Object<string, plan.Plan>} */
    const planTable = {};
    for (let i = 1; i < csvData.length - 1; i++) {
      const data = csvData[i];
      const dRxObj = _createDRxObj(dRxMap, data);
      const dRx = await _upsertDRx(dRxObj);
      const ptObj = pt.createPtObj(ptMap, data);
      if (!ptTable[ptObj.patientID]) {
        ptTable[ptObj.patientID] = await pt.upsertPatient(ptObj);
      }
      await dRx.updateOne({ patient: ptTable[ptObj.patientID]._id });
      const planObj = plan.createPlanObj(planMap, data);
      if (!planTable[planObj.planID]) {
        planTable[planObj.planID] = await plan.upsertPlan(planObj);
      }
      await dRx.updateOne({ plan: planTable[planObj.planID]._id });
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {DRx} dRx
 * @returns {Boolean}
 */
exports.isFileOnly = (dRx) => {
  /** @type {RxStatus} */
  const rxStatus = dRx.rxStatus;
  switch (rxStatus) {
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
 * @param {DigitalRx} dRx
 * @returns {Boolean}
 */
exports.isBilled = (dRx) => {
  if (dRx.rxStatusFin === "BILLED") {
    return true;
  }
  return false;
};
/**
 * @param {DigitalRx} dRx
 * @returns {Boolean}
 */
exports.hasNoCopay = (dRx) => {
  if (dRx.patPay === "0") {
    return true;
  }
  return false;
};
/**
 * @param {DigitalRx} dRx
 * @returns {Boolean}
 */
exports.isRxOnly = (dRx) => {
  if (dRx.drugRxOTC === "RX") {
    return true;
  }
  return false;
};
