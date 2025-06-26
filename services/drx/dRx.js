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

const mapIndex = (csvHeader) => {
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
const createDRxObj = (indexTable, rxReportRow) => {
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
const updateDRx = async (dRxObj, dRx) => {
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
const upsertDRx = async (dRxObj) => {
  try {
    const dRx = await _findDRx(dRxObj);
    if (!dRx) {
      return await _createDRx(dRxObj);
    }
    return await updateDRx(dRxObj, dRx);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Upserts & updates dRx documents thoroughly from the whole CSV Json.
 * @param {[[string]]} csvData
 * @returns {Promise<|undefined>}
 */
exports.upsertRx = async (csvData) => {
  try {
    //
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

module.exports = {
  /**
   * @param {DigitalRx} drx
   * @returns {Boolean}
   */
  isBilled(drx) {
    if (drx.rxStatusFin === "BILLED") {
      return true;
    }
    return false;
  },
  /**
   * @param {DigitalRx} drx
   * @returns {Boolean}
   */
  hasNoCopay(drx) {
    if (drx.patPay === "0") {
      return true;
    }
    return false;
  },
  /**
   * @param {DigitalRx} drx
   * @returns {Boolean}
   */
  isRxOnly(drx) {
    if (drx.drugRxOTC === "RX") {
      return true;
    }
    return false;
  },

  /**
   * @returns {}
   */
  async checkPackage() {
    //
  },
  /**
   * @param {[[string]]} csvData
   * @returns {Promise<[RxObj]|undefined>}
   */
  async mapData(csvData) {
    try {
      const table = mapIndexTable(csvData[0]);
      const pts = {};
      const plans = {};
      /** @type {[RxObj]} */
      const rxObj = [];
      for (let i = 1; i < csvData.length - 1; i++) {
        const data = csvData[i];
        const rx = {};
        for (const key in table) {
          rx[key] = data[table[key]];
        }
        const patientID = rx.patientID;
        if (!patientID) {
          continue;
        }
        rx.patient =
          pts[patientID] || (pts[patientID] = (await pt.upsertPt(rx))._id);
        const planID = rx.planID;
        if (planID) {
          rx.plan =
            plans[planID] || (plans[planID] = (await plan.upsertPlan(rx))._id);
        }
        rxObj.push(rx);
      }
      return rxObj;
    } catch (e) {
      console.log(e);
    }
  },
};
