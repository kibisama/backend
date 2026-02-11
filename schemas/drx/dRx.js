const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const digitalRxSchema = new Schema(
  {
    rxID: { type: String, required: true, unique: true },
    createdDate: Date,
    createdBy: String,
    rxNumber: String,
    fillNo: String,
    rxDateWritten: Date,
    effectiveDate: Date,
    nextFillDate: Date,
    rxDate: Date,
    // date of delivery from dRx if exists
    deliveredDate: Date,
    daw: String,
    sig: String,
    qtyWritten: String,
    refills: String,
    rxQty: String,
    qtyRemaining: String,
    daysSupply: String,
    rxOrigCode: String,
    rxNotes: String,
    rxStatus: String,
    rxStatusFin: String,
    /* Patient Info */
    patient: { type: ObjectId, ref: "DRx Patient", required: true }, // index if memory allows
    /* Doctor Info */
    doctorName: String,
    doctorNPI: String,
    doctorDEA: String,
    /* Drug Info */
    drugName: String,
    drugNDC: String, // CMS
    drugDEA: String,
    drugRxOTC: String,
    bG: String,
    genericFor: String,
    /* Insurance Info */
    plan: { type: ObjectId, ref: "DRx Plan" },
    /* Payment Info */
    totalPaid: String,
    patPay: { type: String, default: "0" },
    insPaid: String,
    dispFeePaid: String,
    insuredID: String,
    cardNumber: String,
    groupNumber: String,
    /* Relational */
    deliveryStation: { type: ObjectId, ref: "Delivery Station", index: true },
    /* Delivery */
    deliveryDate: { type: Date, index: true },
    deliveryLog: { type: ObjectId, ref: "Delivery Log", index: true },
    returnDates: [Date],
    logHistory: [{ type: ObjectId, ref: "Delivery Log" }],
  },
  { timestamps: true, optimisticConcurrency: true }
);

digitalRxSchema.post("findOne", async function (doc) {
  if (doc) {
    await doc.populate([
      { path: "patient" },
      { path: "plan" },
      { path: "deliveryStation" },
      { path: "deliveryLog" },
    ]);
  }
});
digitalRxSchema.post("find", async function (docs) {
  if (docs.length > 0) {
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      await doc.populate([
        { path: "patient" },
        { path: "plan" },
        { path: "deliveryStation" },
        { path: "deliveryLog" },
      ]);
    }
  }
});

const model = mongoose.model("DRx Rx", digitalRxSchema);
/**
 * @typedef {"DC-FILEONLY"|"DISCONTINUED"|"FILEONLY"|"FO-TRANSFERRED"|"FUTURE BILL"|"RENEWED"|"TRANSFERRED"|"TYPED"} RxStatus
 * @typedef {"BILLED"|"CASH"|"NOT BILLED"|"REJECTED"|"REVERSED"} RxStatusFin
 * @typedef {"OTC"|"RX"} DrugRxOTC
 * @typedef {"Brand"|"Generic"|"N/A"} BG
 * @typedef {"0"|"1"|"2"|"3"|"4"|"5"} DrugDEA
 * @typedef {object} DRxSchema
 * @property {string} rxID
 * @property {Date} [createdDate]
 * @property {string} [createdBy]
 * @property {string} [rxNumber]
 * @property {string} [fillNo]
 * @property {Date} [rxDateWritten]
 * @property {Date} [effectiveDate]
 * @property {Date} [rxDate]
 * @property {Date} [deliveredDate]
 * @property {string} [daw]
 * @property {string} [sig]
 * @property {string} [qtyWritten]
 * @property {string} [refills]
 * @property {string} [rxQty]
 * @property {string} [qtyRemaining]
 * @property {string} [daysSupply]
 * @property {string} [rxOrigCode]
 * @property {string} [rxNotes]
 * @property {RxStatus} [rxStatus]
 * @property {RxStatusFin} [rxStatusFin]
 * @property {string|import("mongoose").ObjectId} patient
 * @property {string} [doctorName]
 * @property {string} [doctorNPI]
 * @property {string} [doctorDEA]
 * @property {string} [drugName]
 * @property {string} [drugNDC]
 * @property {DrugDEA} [drugDEA]
 * @property {DrugRxOTC} [drugRxOTC]
 * @property {BG} [bG]
 * @property {string} [genericFor]
 * @property {string|import("mongoose").ObjectId} [plan]
 * @property {string} [totalPaid]
 * @property {string} [patPay]
 * @property {string} [insPaid]
 * @property {string} [dispFeePaid]
 * @property {string} [insuredID]
 * @property {string} [cardNumber]
 * @property {string} [groupNumber]
 * @property {string|import("mongoose").ObjectId} [deliveryStation]
 * @property {Date} [deliveryDate]
 * @property {string|import("mongoose").ObjectId} [deliveryLog]
 * @property {Date[]} [returnDates]
 * @param {string[]|import("mongoose").ObjectId[]} [logHistory]
 * @typedef {mongoose.HydratedDocument<DRxSchema>} DRx
 */

module.exports = model;
