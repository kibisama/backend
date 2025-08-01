const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const digitalRxSchema = new Schema({
  rxID: { type: String, required: true, unique: true, immutable: true },
  createdDate: Date,
  createdBy: String,
  rxNumber: String,
  fillNo: String,
  rxDateWritten: Date,
  effectiveDate: Date,
  nextFillDate: Date,
  rxDate: Date,
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
  patient: { type: ObjectId, ref: "DRx Patient" },
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
  /* Insurance & Payment Info */
  plan: { type: ObjectId, ref: "DRx Plan" },
  totalPaid: String,
  patPay: String,
  insPaid: String,
  dispFeePaid: String,
  insuredID: String,
  cardNumber: String,
  groupNumber: String,

  // extends
  deliveredTo: { type: ObjectId, ref: "Facility" },
});

const model = mongoose.model("DRx Rx", digitalRxSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DigitalRx
 * @typedef {"DC-FILEONLY"|"DISCONTINUED"|"FILEONLY"|"FO-TRANSFERRED"|"FUTURE BILL"|"RENEWED"|"TRANSFERRED"|"TYPED"} RxStatus
 * @typedef {"BILLED"|"CASH"|"NOT BILLED"|"REJECTED"|"REVERSED"} RxStatusFin
 * @typedef {"OTC"|"RX"} DrugRxOTC
 * @typedef {"Brand"|"Generic"|"N/A"} BG
 * @typedef {"0"|"1"|"2"|"3"|"4"|"5"} DrugDEA
 */

module.exports = model;
