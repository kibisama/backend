const dayjs = require("dajys");
const DRX = require("../../schemas/drx/rx");
const pt = require("./patient");
const plan = require("./plan");

/**
 * @typedef {DRX.DigitalRx} DigitalRx
 * @typedef {DRX.RxStatus} RxStatus
 * @typedef {DRX.RxStatusFin} RxStatusFin
 * @typedef {typeof DRX.schema.obj} RxObj
 */

/**
 * @param {RxObj} rx
 * @return {{rxID: string}}
 */
const createBase = (rx) => {
  return { rxID: rx.rxID };
};

module.exports = {
  /**
   * Upserts (or updates if exists) a Digital Rx document.
   * @param {RxObj} rx
   * @returns {Promise<DigitalRx|undefined>}
   */
  async upsertDrx(rx) {
    try {
      const base = createBase(rx);
      const drx = await DRX.findOne(base);
      if (drx === null) {
        return await DRX.create(rx);
      }
      return await DRX.findByIdAndUpdate(drx._id, rx, { new: true });
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * @param {DigitalRx} drx
   * @returns {Boolean}
   */
  isFileOnly(drx) {
    /** @type {RxStatus} */
    const rxStatus = drx.rxStatus;
    switch (rxStatus) {
      case "FILEONLY":
      case "DC-FILEONLY":
      case "FO-TRANSFERRED":
      case "FUTURE BILL":
        return true;
      default:
        return false;
    }
  },
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
   * @param {[string]} csvHeader
   * @returns {}
   */
  mapIndexTable(csvHeader) {
    const table = {};
    csvHeader.forEach((v, i) => {
      table[v] = i;
    });
    return {
      /* Rx Info */
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
      /* Patient Info */
      patientID: table.PatientID,
      patientName: table.PatientName,
      patientFirstName: table.PatientFirstName,
      patientLastName: table.PatientLastName,
      patientDOB: table.PatientDOB,
      patientSex: table.PatientSex,
      patientStreet: table.PatientStreet,
      patientZip: table.PatientZip,
      patientPhone: table.patientPhone,
      patientSSN: table.PaientSSN,
      patNotes: table.PatNotes,
      /* Doctor Info */
      doctorName: table.DoctorName,
      doctorNPI: table.DoctorNPI,
      doctorDEA: table.DoctorDea,
      /* Drug Info */
      drugName: table.DrugName,
      drugNDC: table.DrugNDC,
      drugDEA: table.DrugDea,
      drugRxOTC: table.DrugRxOTC,
      bG: table["Brand/Generic"],
      genericFor: table.GenericFor,
      /* Insurance & Payment Info */
      totalPaid: table.TotalPaid,
      patPay: table.PatPAy,
      insPaid: table.InsPaid,
      dispFeePaid: table.DispFeePaid,
      insuredID: table.Insured_id,
      planID: table.PlanID,
      planName: table.PlanName,
      ansiBin: table.Ansi_Bin,
      pcn: table.PCN,
      cardNumber: table.CardNumber,
      groupNumber: table.GroupNumber,
    };
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
